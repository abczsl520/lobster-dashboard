# 🦞 Lobster Dashboard

> **Real-time cyberpunk monitoring dashboard for [OpenClaw](https://github.com/openclaw/openclaw) AI agent sessions**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/abczsl520/lobster-dashboard?style=social)](https://github.com/abczsl520/lobster-dashboard/stargazers)

<p align="center">
  <img src="https://img.shields.io/badge/style-cyberpunk-blueviolet" alt="Cyberpunk">
  <img src="https://img.shields.io/badge/realtime-WebSocket-ff69b4" alt="WebSocket">
  <img src="https://img.shields.io/badge/security-hardened-success" alt="Security">
</p>

---

## ✨ Features

🎨 **Cyberpunk Aesthetic**
- Hex grid particle system with interactive mouse glow
- Force-directed topology with physics simulation
- Scanning lines, glowing edges, and data packet animations
- Lobster emoji nodes 🦞

⚡ **Real-time Monitoring**
- Live WebSocket updates (sub-second latency)
- Per-session and aggregate token tracking
- Activity feed with status changes and tool usage
- Auto-reconnect on connection loss

🔒 **Security Hardened**
- Timing-safe password comparison
- Login rate limiting (5 attempts/min per IP)
- Token set capped at 1000 to prevent memory exhaustion
- XSS protection with input sanitization
- HttpOnly + Secure cookies for HTTPS

🚀 **Production Ready**
- Push API with rate limiting and validation
- Nginx reverse proxy support
- Configurable base path for sub-directory deployment
- Health check endpoint

---

## 🎬 Demo

> **Coming soon** — Deploy it and see the cyberpunk magic yourself! 🦞✨

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/abczsl520/lobster-dashboard.git
cd lobster-dashboard

# Install dependencies
npm install

# Setup configuration
cp config.example.json config.json
# Edit config.json with your password and push token

# Start the server
npm start
```

Open `http://localhost:3870` and log in with your password.

---

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "port": 3870,
  "basePath": "",
  "gateway": { "mode": "push" },
  "auth": {
    "pushToken": "your_secret_push_token",
    "viewPassword": "your_login_password"
  }
}
```

| Field | Description |
|-------|-------------|
| `port` | Server listen port (default: 3870) |
| `basePath` | URL prefix for reverse proxy (e.g. `/lobster`). Leave `""` for root. |
| `gateway.mode` | Data ingestion mode (currently `push` only) |
| `auth.pushToken` | Secret token for the Push API (`X-Push-Token` header) |
| `auth.viewPassword` | Password for the web login page |
| `https` | Set to `true` to enable secure cookies (optional) |

**Environment Variables:**
- `LOBSTER_HTTPS=1` — Enable secure cookies (alternative to config)

---

## 📡 Push API

Send session data from your OpenClaw instance:

```bash
curl -X POST http://localhost:3870/api/push \
  -H "Content-Type: application/json" \
  -H "X-Push-Token: your_secret_push_token" \
  -d '{
    "sessions": [
      {
        "key": "agent:main:discord:my-server",
        "resolvedName": "MyBot",
        "updatedAt": 1710000000000,
        "model": "claude-sonnet-4-20250514",
        "kind": "group",
        "lastMsg": "Working on it...",
        "lastTool": "exec",
        "totalTokens": 15000,
        "inputTokens": 12000,
        "outputTokens": 3000
      }
    ]
  }'
```

### OpenClaw Pusher Script

Create a cron/launchd script to push data every 5 seconds:

```bash
#!/bin/bash
# pusher.sh — run every 5s via launchd/cron
SESSIONS=$(openclaw sessions list --json 2>/dev/null)
curl -s -X POST http://localhost:3870/api/push \
  -H "Content-Type: application/json" \
  -H "X-Push-Token: your_secret_push_token" \
  -d "{\"sessions\": $SESSIONS}"
```

**macOS launchd example:**

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
</dict>
</plist>
```

---

## 🌐 Nginx Reverse Proxy

Deploy behind nginx with a sub-path:

```nginx
location /lobster/ {
    proxy_pass http://127.0.0.1:3870/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;
}
```

Then set `"basePath": "/lobster"` in `config.json`.

---

## 🏗️ Architecture

```
server.js                  ← Express + auth + push API + rate limiting
services/
  ws-broadcaster.js        ← WebSocket server with auth + heartbeat
  gateway-poller.js        ← State management + activity log
public/
  index.html               ← Dashboard page
  login.html               ← Login page
  css/style.css            ← Cyberpunk styles
  js/app.js                ← WebSocket client + UI rendering
  js/topology.js           ← Force-directed node topology (Canvas)
  js/particles.js          ← Hex grid particle background
```

**Tech Stack:**
- Backend: Node.js + Express + WebSocket (ws)
- Frontend: Vanilla JS + Canvas API
- No build step, no frameworks — just pure web tech

---

## 🔒 Security

- **Timing-safe password comparison** (`crypto.timingSafeEqual`)
- **Login rate limiting** (5 attempts per minute per IP)
- **Token set capped** at 1000 to prevent memory exhaustion
- **Push API rate limiting** (1 request per 3 seconds)
- **XSS protection** with input sanitization (`esc()` function)
- **WebSocket auth** requires valid token from cookie or query param
- **HttpOnly cookies** with optional Secure flag for HTTPS

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ideas for contributions:**
- Add screenshot/demo GIF to README
- Implement polling mode (alternative to push API)
- Add Prometheus metrics endpoint
- Create Docker image
- Add dark/light theme toggle
- Implement session filtering and search

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=abczsl520/lobster-dashboard&type=Date)](https://star-history.com/#abczsl520/lobster-dashboard&Date)

---

## 🙏 Acknowledgments

Built for the [OpenClaw](https://github.com/openclaw/openclaw) community.

Inspired by cyberpunk aesthetics and real-time monitoring dashboards.

---

<p align="center">
  Made with 🦞 and ⚡ by the Lobster Dashboard contributors
</p>
