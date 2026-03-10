const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Load config
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('[lobster] config.json not found. Run: cp config.example.json config.json');
  process.exit(1);
}
const config = require(configPath);

const { setupWebSocket } = require('./services/ws-broadcaster');
const { startPoller, pushState, getLatestState } = require('./services/gateway-poller');

const app = express();
const server = http.createServer(app);

const validTokens = new Set();

function generateToken() {
  const token = crypto.randomBytes(24).toString('hex');
  validTokens.add(token);
  setTimeout(() => validTokens.delete(token), 86400000);
  return token;
}

const BASE_PATH = config.basePath || '';

// Cookie parser
app.use((req, res, next) => {
  req.cookies = {};
  const c = req.headers.cookie;
  if (c) c.split(';').forEach(p => {
    const [k, v] = p.trim().split('=');
    if (k && v) req.cookies[k] = v;
  });
  next();
});

app.use(express.json({ limit: '2mb' }));

// === PRE-AUTH ROUTES ===

// Push API (own token auth)
let lastPushTime = 0;
app.post('/api/push', (req, res) => {
  const token = req.headers['x-push-token'];
  if (token !== config.auth.pushToken) return res.status(401).json({ error: 'unauthorized' });
  const now = Date.now();
  if (now - lastPushTime < 3000) return res.status(429).json({ error: 'too fast' });
  lastPushTime = now;
  const data = req.body;
  if (!data || !Array.isArray(data.sessions)) return res.status(400).json({ error: 'invalid' });
  if (data.sessions.length > 500) return res.status(400).json({ error: 'too many' });
  for (const s of data.sessions) {
    if (!s || typeof s !== 'object') return res.status(400).json({ error: 'bad session' });
    if (s.key && s.key.length > 200) s.key = s.key.slice(0, 200);
    if (s.resolvedName && s.resolvedName.length > 50) s.resolvedName = s.resolvedName.slice(0, 50);
    if (s.lastMsg && s.lastMsg.length > 200) s.lastMsg = s.lastMsg.slice(0, 200);
    if (s.lastTool && s.lastTool.length > 50) s.lastTool = s.lastTool.slice(0, 50);
  }
  pushState(data);
  res.json({ ok: true });
});

// Login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login action
app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  if (req.body && req.body.password === config.auth.viewPassword) {
    const token = generateToken();
    res.cookie('lobster_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400000, path: '/' });
    return res.redirect(BASE_PATH + '/');
  }
  res.redirect(BASE_PATH + '/login.html?error=1');
});

// Health
app.get('/api/health', (req, res) => { res.json({ ok: true }); });

// === AUTH MIDDLEWARE ===
function authCheck(req, res, next) {
  const token = req.cookies.lobster_token || req.query.token;
  if (token && validTokens.has(token)) return next();
  res.redirect(BASE_PATH + '/login.html');
}

// Authenticated routes
app.get('/api/state', authCheck, (req, res) => {
  const state = getLatestState();
  res.json(state || { gatewayOk: false, sessions: [] });
});

// No cache for HTML, cache for assets
app.use('/', authCheck, (req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
}, express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// WebSocket with auth
const wsBroadcaster = setupWebSocket(server, validTokens);

startPoller(config.gateway, (data) => {
  wsBroadcaster.broadcast(JSON.stringify({ type: 'state', data }));
});

server.listen(config.port, () => {
  console.log('[lobster] running on port ' + config.port);
});
