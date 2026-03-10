# Frequently Asked Questions

## General

### What is Lobster Dashboard?

Lobster Dashboard is a real-time monitoring dashboard for [OpenClaw](https://github.com/openclaw/openclaw) AI agent sessions. It provides a cyberpunk-themed interface with force-directed topology visualization, particle effects, and live activity feeds.

### Why "Lobster"?

Because lobsters are cool 🦞 and the emoji makes great node icons in the force-directed graph.

### Is it production-ready?

Yes! Lobster Dashboard includes:
- Security hardening (timing-safe password comparison, rate limiting, XSS protection)
- WebSocket auto-reconnect
- Input validation and sanitization
- Health check endpoint
- Configurable deployment options

---

## Installation & Setup

### What are the system requirements?

- Node.js ≥ 18.0.0
- npm (comes with Node.js)
- An OpenClaw instance to monitor

### How do I get session data into the dashboard?

The dashboard uses a **push model**. You need to set up a script (pusher) that periodically calls the Push API with session data from `openclaw sessions list --json`.

See the [Installation Guide](Installation.md) for detailed setup instructions.

### Can I run multiple dashboards?

Yes! Each dashboard instance is independent. Just use different ports and push tokens.

### Does it work with Docker?

Not officially packaged yet, but you can easily create a Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3870
CMD ["node", "server.js"]
```

---

## Configuration

### How do I change the port?

Edit `config.json` and change the `port` field:

```json
{
  "port": 8080
}
```

### How do I deploy behind a reverse proxy?

Set `basePath` in `config.json` to match your proxy path:

```json
{
  "basePath": "/lobster"
}
```

Then configure your reverse proxy (nginx, Apache, Caddy) to forward requests. See [Installation Guide](Installation.md#nginx-reverse-proxy) for examples.

### How do I enable HTTPS?

Set `"https": true` in `config.json` or use the `LOBSTER_HTTPS=1` environment variable. This enables the `Secure` flag on cookies.

**Note:** Lobster Dashboard itself doesn't handle TLS termination. Use a reverse proxy (nginx, Caddy) for HTTPS.

### Can I customize the UI colors?

Yes! Edit `public/css/style.css`. The main color variables are at the top:

```css
:root {
  --bg-dark: #0a0e17;
  --bg-panel: rgba(15, 23, 42, 0.85);
  --accent-cyan: #00e5ff;
  --accent-purple: #b44aff;
  /* ... */
}
```

---

## Security

### Is the password stored securely?

The password is stored in `config.json` (plaintext), which should be protected with file permissions (`chmod 600`). The comparison uses `crypto.timingSafeEqual` to prevent timing attacks.

For production, consider using environment variables or a secrets manager.

### What about brute force attacks?

Login rate limiting is enabled by default: **5 attempts per minute per IP**. After that, the IP is blocked for 1 minute.

### Is the Push API secure?

Yes:
- Requires a secret token (`X-Push-Token` header)
- Rate limited to 1 request per 3 seconds
- Input validation (max 500 sessions, field length limits)
- Token comparison uses `crypto.timingSafeEqual`

### Are there any known vulnerabilities?

All user input is sanitized before rendering to prevent XSS. The codebase has been audited for:
- XSS (innerHTML injection)
- Timing attacks (password/token comparison)
- Memory exhaustion (token set capped at 1000)
- Rate limiting bypass

Run `npm audit` to check for dependency vulnerabilities.

---

## Usage

### Why is the dashboard showing "No active sessions"?

Possible causes:
1. **Pusher not running** — Check if your pusher script is running and sending data
2. **Wrong push token** — Verify the token in your pusher matches `config.json`
3. **Network issue** — Check if the pusher can reach the dashboard (firewall, port)
4. **OpenClaw not running** — Verify `openclaw sessions list --json` returns data

### How do I see token consumption?

Token stats are displayed in:
- **Header bar** — Total tokens (🪙 badge)
- **Token bar** — Total, Input, Output breakdown
- **Agent cards** — Per-session token count

### What does "active" vs "idle" mean?

- **Active** — Session updated within the last 60 seconds (green)
- **Idle** — Session updated 1-5 minutes ago (yellow)
- **Offline** — Session updated more than 5 minutes ago (gray)

### Can I filter or search sessions?

Not yet! This is a planned feature. For now, sessions are sorted by status (active → idle → offline).

---

## Troubleshooting

### WebSocket connection fails

1. **Check the browser console** for errors
2. **Verify the auth token** — Cookie should be set after login
3. **Check basePath** — If deploying with a sub-path, ensure `config.json` matches your proxy config
4. **Firewall** — Ensure WebSocket upgrade requests aren't blocked

### Dashboard shows "GATEWAY OFFLINE"

This means no data has been received via the Push API. Check:
1. Pusher script is running
2. Push token is correct
3. Network connectivity

### High memory usage

- **Token set cap** — Limited to 1000 tokens (auto-evicts oldest)
- **Activity log** — Limited to 200 entries, cleaned daily
- **Session count** — Push API rejects more than 500 sessions per request

If memory grows unbounded, please [open an issue](https://github.com/abczsl520/lobster-dashboard/issues).

### Particles are laggy

The particle system is GPU-accelerated (Canvas 2D). If performance is poor:
1. Reduce particle count in `public/js/particles.js` (line ~50: `for (var i = 0; i < 100; i++)`)
2. Disable particles entirely (comment out the `draw()` call)
3. Use a modern browser (Chrome, Firefox, Safari)

---

## Development

### How do I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Where is the test suite?

There isn't one yet! Contributions welcome. Priority areas:
- Unit tests for `services/gateway-poller.js`
- Integration tests for Push API
- Security tests (XSS, rate limiting)

### Can I add new features?

Absolutely! Open a [feature request](https://github.com/abczsl520/lobster-dashboard/issues/new?template=feature_request.md) first to discuss the idea.

---

## Miscellaneous

### Does it work with other AI frameworks?

Lobster Dashboard is designed for OpenClaw, but the Push API is generic. You can adapt it to any system that can send JSON session data.

### Can I use it for non-AI monitoring?

Sure! The topology and activity feed work for any real-time data. Just adapt the Push API payload.

### Is there a hosted version?

Not yet. Lobster Dashboard is self-hosted only.

### How do I report a bug?

Open a [bug report](https://github.com/abczsl520/lobster-dashboard/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node.js version, browser)
- Logs (if applicable)

---

## License

Lobster Dashboard is MIT licensed. See [LICENSE](../LICENSE) for details.
