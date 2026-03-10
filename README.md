# 🦞 Lobster Dashboard

Real-time cyberpunk monitoring dashboard for [OpenClaw](https://github.com/openclaw/openclaw) AI agent sessions.

![Cyberpunk](https://img.shields.io/badge/style-cyberpunk-blueviolet) ![Node.js](https://img.shields.io/badge/node-%3E%3D18-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Force-directed topology** — physics simulation with lobster emoji nodes
- **Real-time WebSocket** — live state updates via push API
- **Cyberpunk UI** — hex grid particles, scanning lines, glowing edges, data packets
- **Token consumption** — per-session and aggregate token tracking
- **Activity feed** — live log of agent status changes and tool usage
- **Secure auth** — timing-safe password compare, login rate limiting, cookie auth with 24h expiry
- **Push API** — external data ingestion with rate limiting and input validation

## Quick Start

```bash
git clone https://github.com/abczsl520/lobster-dashboard.git
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
| `port` | Server listen port |
| `basePath` | URL prefix behind a reverse proxy (e.g. `/lobster`). Leave `""` for root. |
| `gateway.mode` | Currently `push` only — data is pushed via the Push API |
| `auth.pushToken` | Secret token for the Push API (`X-Push-Token` header) |
| `auth.viewPassword` | Password for the web login page |

For HTTPS environments, set `"https": true` in config or `LOBSTER_HTTPS=1` env var to enable secure cookies.

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

When deploying behind nginx with a sub-path, set `basePath` to match:

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

Then set `"basePath": "/lobster"` in config.json.

## Architecture

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

## Security

- Timing-safe password comparison (`crypto.timingSafeEqual`)
- Login rate limiting (5 attempts per minute per IP)
- Token set capped at 1000 to prevent memory exhaustion
- Push API with dedicated token auth + rate limiting (1 req / 3s)
- WebSocket upgrade requires valid auth token
- HttpOnly cookies with optional Secure flag

## License

MIT
