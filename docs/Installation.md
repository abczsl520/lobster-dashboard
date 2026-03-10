# Installation Guide

## Prerequisites

- **Node.js** ≥ 18.0.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **OpenClaw** instance running ([Setup guide](https://github.com/openclaw/openclaw))

## Quick Install

```bash
# Clone the repository
git clone https://github.com/abczsl520/lobster-dashboard.git
cd lobster-dashboard

# Install dependencies
npm install

# Setup configuration
cp config.example.json config.json

# Edit config.json with your credentials
nano config.json  # or use your favorite editor

# Start the server
npm start
```

The dashboard will be available at `http://localhost:3870`.

---

## Configuration

Edit `config.json`:

```json
{
  "port": 3870,
  "basePath": "",
  "gateway": {
    "mode": "push"
  },
  "auth": {
    "pushToken": "your_secret_push_token",
    "viewPassword": "your_login_password"
  }
}
```

### Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `port` | number | Yes | Server listen port (default: 3870) |
| `basePath` | string | No | URL prefix for reverse proxy (e.g. `/lobster`). Leave empty for root. |
| `gateway.mode` | string | Yes | Data ingestion mode (currently only `"push"` is supported) |
| `auth.pushToken` | string | Yes | Secret token for the Push API (`X-Push-Token` header) |
| `auth.viewPassword` | string | Yes | Password for the web login page |
| `https` | boolean | No | Enable secure cookies (set to `true` for HTTPS deployments) |

### Environment Variables

- `LOBSTER_HTTPS=1` — Enable secure cookies (alternative to `config.https`)

---

## Setting Up the Pusher

The dashboard receives data via the Push API. You need to set up a script that periodically sends OpenClaw session data.

### macOS (launchd)

1. Create the pusher script:

```bash
#!/bin/bash
# /path/to/pusher.sh

SESSIONS=$(openclaw sessions list --json 2>/dev/null)
curl -s -X POST http://localhost:3870/api/push \
  -H "Content-Type: application/json" \
  -H "X-Push-Token: your_secret_push_token" \
  -d "{\"sessions\": $SESSIONS}"
```

2. Make it executable:

```bash
chmod +x /path/to/pusher.sh
```

3. Create a launchd plist at `~/Library/LaunchAgents/com.lobster.pusher.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.lobster.pusher</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/pusher.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>5</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/lobster-pusher.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/lobster-pusher.err</string>
</dict>
</plist>
```

4. Load the agent:

```bash
launchctl load ~/Library/LaunchAgents/com.lobster.pusher.plist
```

### Linux (systemd timer)

1. Create the pusher script at `/usr/local/bin/lobster-pusher.sh`:

```bash
#!/bin/bash
SESSIONS=$(openclaw sessions list --json 2>/dev/null)
curl -s -X POST http://localhost:3870/api/push \
  -H "Content-Type: application/json" \
  -H "X-Push-Token: your_secret_push_token" \
  -d "{\"sessions\": $SESSIONS}"
```

2. Make it executable:

```bash
chmod +x /usr/local/bin/lobster-pusher.sh
```

3. Create a systemd service at `/etc/systemd/system/lobster-pusher.service`:

```ini
[Unit]
Description=Lobster Dashboard Pusher
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/lobster-pusher.sh
User=your-user

[Install]
WantedBy=multi-user.target
```

4. Create a systemd timer at `/etc/systemd/system/lobster-pusher.timer`:

```ini
[Unit]
Description=Lobster Dashboard Pusher Timer

[Timer]
OnBootSec=10s
OnUnitActiveSec=5s

[Install]
WantedBy=timers.target
```

5. Enable and start the timer:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lobster-pusher.timer
sudo systemctl start lobster-pusher.timer
```

### Linux (cron)

Add to your crontab (`crontab -e`):

```cron
* * * * * /path/to/pusher.sh
* * * * * sleep 5 && /path/to/pusher.sh
* * * * * sleep 10 && /path/to/pusher.sh
* * * * * sleep 15 && /path/to/pusher.sh
* * * * * sleep 20 && /path/to/pusher.sh
* * * * * sleep 25 && /path/to/pusher.sh
* * * * * sleep 30 && /path/to/pusher.sh
* * * * * sleep 35 && /path/to/pusher.sh
* * * * * sleep 40 && /path/to/pusher.sh
* * * * * sleep 45 && /path/to/pusher.sh
* * * * * sleep 50 && /path/to/pusher.sh
* * * * * sleep 55 && /path/to/pusher.sh
```

This runs the script every 5 seconds.

---

## Deployment

### Running as a Service (systemd)

1. Create `/etc/systemd/system/lobster-dashboard.service`:

```ini
[Unit]
Description=Lobster Dashboard
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/lobster-dashboard
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment="NODE_ENV=production"
Environment="LOBSTER_HTTPS=1"

[Install]
WantedBy=multi-user.target
```

2. Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lobster-dashboard
sudo systemctl start lobster-dashboard
```

### Running with PM2

```bash
npm install -g pm2
pm2 start server.js --name lobster-dashboard
pm2 save
pm2 startup  # Follow the instructions
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name dashboard.example.com;

    location / {
        proxy_pass http://127.0.0.1:3870;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

For sub-path deployment:

```nginx
location /lobster/ {
    proxy_pass http://127.0.0.1:3870/;
    # ... same headers as above
}
```

Then set `"basePath": "/lobster"` in `config.json`.

---

## Troubleshooting

### Dashboard not loading

1. Check if the server is running: `curl http://localhost:3870/api/health`
2. Check logs for errors
3. Verify `config.json` is valid JSON

### WebSocket connection failed

1. Check browser console for errors
2. Verify the auth token is valid (check cookies)
3. If behind a proxy, ensure WebSocket upgrade headers are set

### No sessions showing

1. Verify the pusher script is running
2. Check pusher logs for errors
3. Test the Push API manually:

```bash
curl -X POST http://localhost:3870/api/push \
  -H "Content-Type: application/json" \
  -H "X-Push-Token: your_secret_push_token" \
  -d '{"sessions":[]}'
```

### Login not working

1. Verify `auth.viewPassword` in `config.json`
2. Check if you're being rate limited (5 attempts per minute)
3. Clear browser cookies and try again

---

## Next Steps

- [Configuration Guide](Configuration.md)
- [API Reference](API-Reference.md)
- [Security Best Practices](Security.md)
