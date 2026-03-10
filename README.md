# 🦞 Lobster Dashboard

Real-time cyberpunk monitoring dashboard for [OpenClaw](https://github.com/openclaw/openclaw) AI agent sessions.

![Cyberpunk](https://img.shields.io/badge/style-cyberpunk-blueviolet) ![Node.js](https://img.shields.io/badge/node-%3E%3D18-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Force-directed topology** — D3-style physics simulation with lobster emoji nodes
- **Real-time WebSocket** — live state updates pushed from OpenClaw gateway
- **Cyberpunk UI** — hex grid particles, scanning lines, glowing edges, data packets
- **Token consumption** — per-session and aggregate token tracking
- **Activity feed** — live log of agent status changes and tool usage
- **Password auth** — cookie-based login with 24h expiry, WebSocket auth
- **Push API** — external data ingestion with rate limiting and input validation

## Quick Start

```bash
git clone https://github.com/nicepkg/lobster-dashboard.git
cd lobster-dashboard
npm install
cp config.example.json config.json
# Edit config.json with your password and push token
node server.js
```

Open `http://localhost:3870` and log in.

## Configuration

Edit `config.json`:

```json
{
  "port": 3870,
  "basePath": "/lobster",
  "gateway": { "pollIntervalMs": 5000 },
  "auth": {
    "pushToken": "your_secret_push_token",
    "viewPassword": "your_login_password"
  }
}
```

- `port` — server listen port
- `basePath` — URL prefix when behind a reverse proxy (e.g. `/lobster`). Set to `""` for root.
- `auth.pushToken` — token for the push API (`X-Push-Token` header)
- `auth.viewPassword` — password for the web login page

## Push API

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

### OpenClaw Pusher Example

A simple cron/launchd script to push OpenClaw session data:

```bash
#!/bin/bash
# pusher.sh — run every 5s via launchd/cron
SESSIONS=$(openclaw sessions list --json 2>/dev/null)
curl -s -X POST http://localhost:3870/api/push \
  -H "Content-Type: application/json" \
  -H "X-Push-Token: your_secret_push_token" \
  -d "{\"sessions\": $SESSIONS}"
```

## Nginx Reverse Proxy

```nginx
location /lobster/ {
    proxy_pass http://127.0.0.1:3870/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_buffering off;
}
```

## Architecture

```
server.js                  ← Express + auth + push API
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

## Screenshots

> Coming soon — deploy it and see for yourself 🦞

## License

MIT
