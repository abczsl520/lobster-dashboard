const { WebSocketServer } = require('ws');
const url = require('url');

function setupWebSocket(server, validTokens) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set();

  // Auth: check token from query param
  server.on('upgrade', (req, socket, head) => {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    // Check auth token from query or cookie
    let token = parsed.query.token;
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/lobster_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token || !validTokens.has(token)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });

  // Heartbeat: ping every 30s, kill dead connections
  setInterval(() => {
    for (const ws of clients) {
      if (!ws.isAlive) {
        clients.delete(ws);
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch (e) {}
    }
  }, 30000);

  function broadcast(data) {
    for (const ws of clients) {
      if (ws.readyState === 1) {
        try { ws.send(data); } catch (e) {}
      }
    }
  }

  return { broadcast, clients };
}

module.exports = { setupWebSocket };
