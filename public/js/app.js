// Main app - WebSocket connection + UI updates
(function() {
  var ws = null;

  // Get auth token from cookie
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  }

  function connect() {
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var token = getCookie('lobster_token');
    // Auto-detect base path from current location
    var basePath = location.pathname.replace(/\/[^/]*$/, '');
    var wsUrl = proto + '//' + location.host + basePath + '/ws?token=' + token;
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
      document.getElementById('gwStatus').textContent = '⚡ ONLINE';
      document.getElementById('gwStatus').className = 'gateway-status';
    };

    ws.onclose = function() {
      document.getElementById('gwStatus').textContent = '❌ OFFLINE';
      document.getElementById('gwStatus').className = 'gateway-status error';
      setTimeout(connect, 3000);
    };

    ws.onmessage = function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'state') handleState(msg.data);
      } catch (err) {}
    };
  }

  function handleState(state) {
    if (!state) return;

    document.getElementById('statActive').textContent = '🟢 ' + state.activeSessions + ' ACTIVE';
    document.getElementById('statIdle').textContent = '🟡 ' + state.idleSessions + ' IDLE';
    document.getElementById('statTotal').textContent = '📊 ' + state.totalSessions + ' TODAY';

    // Token stats in header
    if (state.tokenStats) {
      document.getElementById('statTokens').textContent = '🪙 ' + formatTokens(state.tokenStats.total);
      document.getElementById('tokenTotal').textContent = formatTokens(state.tokenStats.total);
      document.getElementById('tokenIn').textContent = formatTokens(state.tokenStats.input);
      document.getElementById('tokenOut').textContent = formatTokens(state.tokenStats.output);
    }

    if (!state.gatewayOk) {
      document.getElementById('gwStatus').textContent = '⚠️ GATEWAY OFFLINE';
      document.getElementById('gwStatus').className = 'gateway-status error';
    } else {
      document.getElementById('gwStatus').textContent = '⚡ ONLINE';
      document.getElementById('gwStatus').className = 'gateway-status';
    }

    if (window.setParticleActivity) window.setParticleActivity(state.activeSessions);
    renderAgentCards(state.sessions);
    if (window.updateTopology) window.updateTopology(state.sessions);
    if (state.activityLog) renderFeed(state.activityLog);
  }

  function renderAgentCards(sessions) {
    var container = document.getElementById('agentCards');
    container.innerHTML = '';

    if (sessions.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:40px;font-size:13px;">No active sessions</div>';
      return;
    }

    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      var card = document.createElement('div');
      card.className = 'agent-card ' + s.status;

      var channelLabel = s.channel === 'discord' ? '💬 Discord' : s.channel === 'telegram' ? '✈️ Telegram' : '📡 ' + s.channel;
      var typeLabel = s.chatType === 'group' ? 'Group' : s.chatType === 'dm' ? 'DM' : s.chatType;
      var ageStr = formatAge(s.ageMs);
      var toolHtml = s.lastTool ? ' <span class="tool-tag">⚡' + esc(s.lastTool) + '</span>' : '';
      var tokenStr = s.tokens ? ' · ' + formatTokens(s.tokens) + ' tokens' : '';

      card.innerHTML =
        '<div class="agent-name"><span class="dot ' + s.status + '"></span>' + esc(s.displayName) + '</div>' +
        '<div class="agent-meta">' +
          '<div><span class="channel-tag">' + channelLabel + '</span> ' +
          '<span class="channel-tag">' + typeLabel + '</span>' + toolHtml + '</div>' +
          '<div>' + esc(s.model) + ' · ' + ageStr + tokenStr + '</div>' +
        '</div>' +
        (s.lastMsg ? '<div class="agent-msg">💬 ' + esc(s.lastMsg) + '</div>' : '');

      container.appendChild(card);
    }
  }

  function renderFeed(logs) {
    var container = document.getElementById('liveFeed');
    document.getElementById('feedCount').textContent = logs.length;

    var colorMap = { green: '#22c55e', yellow: '#eab308', blue: '#38bdf8', dim: '#475569' };
    var html = '';
    for (var i = 0; i < Math.min(logs.length, 50); i++) {
      var item = logs[i];
      var channelIcon = item.channel === 'discord' ? '💬' : item.channel === 'telegram' ? '✈️' : '📡';
      html +=
        '<div class="feed-item">' +
        '<span class="feed-time">' + item.time + '</span> ' +
        channelIcon + ' ' +
        '<span class="feed-agent">' + esc(item.agent) + '</span> ' +
        '<span class="feed-action" style="color:' + (colorMap[item.color] || '#e2e8f0') + '">' + esc(item.action) + '</span>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function updateClock() {
    var now = new Date();
    document.getElementById('clock').textContent =
      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  }
  setInterval(updateClock, 1000);
  updateClock();

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function formatAge(ms) {
    if (ms < 60000) return Math.floor(ms / 1000) + 's ago';
    if (ms < 3600000) return Math.floor(ms / 60000) + 'm ago';
    if (ms < 86400000) return Math.floor(ms / 3600000) + 'h ago';
    return Math.floor(ms / 86400000) + 'd ago';
  }
  function formatTokens(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return '' + n;
  }

  connect();
  fetch('api/state').then(function(r) { return r.json(); }).then(handleState).catch(function() {});
})();
