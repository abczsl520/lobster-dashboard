// Sci-fi topology: force-directed lobster emoji nodes
(function() {
  var canvas = document.getElementById('topoCanvas');
  var ctx = canvas.getContext('2d');
  var nodes = [];
  var edges = [];
  var W, H;
  var phase = 0;
  var prevNodeMap = {}; // persist positions across updates

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height - 44;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 100);

  var coreNode = {
    id: 'core', label: 'OPENCLAW',
    x: 0, y: 0, vx: 0, vy: 0, r: 75,
    color: '#b44aff',
    glowColor: 'rgba(180,74,255,0.3)',
    emoji: '\uD83E\uDD9E', emojiSize: 100, fixed: true
  };

  function statusColor(s) {
    return s === 'active' ? '#00ff88' : s === 'idle' ? '#ffb800' : '#2a3a4a';
  }
  function statusGlow(s) {
    return s === 'active' ? 'rgba(0,255,136,0.18)' : s === 'idle' ? 'rgba(255,184,0,0.10)' : 'transparent';
  }
  function tokenRadius(tokens, max) {
    if (!max || max <= 0) return 30;
    return 26 + Math.sqrt(Math.min(tokens / max, 1)) * 34;
  }
  function formatK(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return '' + n;
  }

  // Clip edge to node boundaries
  function clipEdge(from, to) {
    var dx = to.x - from.x, dy = to.y - from.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;
    var ux = dx / len, uy = dy / len;
    var m = 6;
    return {
      x1: from.x + ux * (from.r + m), y1: from.y + uy * (from.r + m),
      x2: to.x - ux * (to.r + m), y2: to.y - uy * (to.r + m),
      len: len
    };
  }

  // ─── Force simulation ───
  function simulate() {
    if (nodes.length < 2) return;
    var alpha = 0.3; // damping
    var repulsion = 8000;
    var attraction = 0.005;
    var centerPull = 0.01;
    var padding = 30;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.fixed) continue;
      var fx = 0, fy = 0;

      // Repulsion from all other nodes
      for (var j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        var o = nodes[j];
        var dx = n.x - o.x, dy = n.y - o.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = n.r + o.r + 30;
        if (dist < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = 1; }
        var force = repulsion / (dist * dist);
        // Extra push if overlapping
        if (dist < minDist) force += (minDist - dist) * 0.5;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      // Attraction toward core (spring)
      var dcx = coreNode.x - n.x, dcy = coreNode.y - n.y;
      var dcore = Math.sqrt(dcx * dcx + dcy * dcy);
      var idealDist = Math.min(W, H) * 0.22 + n.r;
      if (dcore > 1) {
        var spring = (dcore - idealDist) * attraction;
        fx += (dcx / dcore) * spring;
        fy += (dcy / dcore) * spring;
      }

      // Gentle center gravity
      fx += (W / 2 - n.x) * centerPull * 0.3;
      fy += (H / 2 - n.y) * centerPull * 0.3;

      // Boundary containment
      n.vx = (n.vx + fx) * alpha;
      n.vy = (n.vy + fy) * alpha;
      n.x += n.vx;
      n.y += n.vy;

      // Keep inside canvas
      if (n.x - n.r < padding) n.x = padding + n.r;
      if (n.x + n.r > W - padding) n.x = W - padding - n.r;
      if (n.y - n.r < padding) n.y = padding + n.r;
      if (n.y + n.r > H - padding) n.y = H - padding - n.r;
    }
  }

  window.updateTopology = function(sessions) {
    resize();
    // Save previous positions
    prevNodeMap = {};
    for (var k = 0; k < nodes.length; k++) {
      if (nodes[k].id !== 'core') {
        prevNodeMap[nodes[k].id] = { x: nodes[k].x, y: nodes[k].y, vx: nodes[k].vx || 0, vy: nodes[k].vy || 0 };
      }
    }

    nodes = [coreNode];
    edges = [];
    coreNode.x = W / 2;
    coreNode.y = H / 2;

    var maxTokens = 0;
    for (var j = 0; j < sessions.length; j++) {
      if ((sessions[j].tokens || 0) > maxTokens) maxTokens = sessions[j].tokens;
    }
    var count = sessions.length;

    for (var i = 0; i < count; i++) {
      var s = sessions[i];
      var r = tokenRadius(s.tokens || 0, maxTokens);
      var name = (s.displayName || '').replace(/discord:|telegram:|agent:main:/, '');
      if (name.length > 18) name = name.slice(0, 18) + '\u2026';

      // Reuse previous position or start at random offset from center
      var prev = prevNodeMap[s.key];
      var nx, ny, nvx, nvy;
      if (prev) {
        nx = prev.x; ny = prev.y; nvx = prev.vx; nvy = prev.vy;
      } else {
        var angle = Math.random() * Math.PI * 2;
        var dist = Math.min(W, H) * 0.25 + Math.random() * 60;
        nx = W / 2 + Math.cos(angle) * dist;
        ny = H / 2 + Math.sin(angle) * dist;
        nvx = 0; nvy = 0;
      }

      nodes.push({
        id: s.key, label: name,
        x: nx, y: ny, vx: nvx, vy: nvy,
        r: r, color: statusColor(s.status),
        glowColor: statusGlow(s.status),
        status: s.status, tool: s.lastTool,
        tokens: s.tokens || 0,
        emoji: '\uD83E\uDD9E', emojiSize: Math.round(r * 1.5)
      });
      edges.push({ from: 'core', to: s.key, active: s.status === 'active' });
    }
  };

  function findNode(id) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return nodes[i];
    }
    return null;
  }

  function draw() {
    if (!W) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, W, H);
    phase += 0.012;

    // Run physics
    simulate();

    // LAYER 1: Ambient rings around core
    drawAmbient();

    // LAYER 2: Edges (clipped)
    drawEdges();

    // LAYER 3: Node glow rings (stroke only)
    for (var i = 0; i < nodes.length; i++) {
      drawNodeEffects(nodes[i]);
    }

    // LAYER 4: ALL emojis + labels (core last)
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === 'core') continue;
      drawNodeEmoji(nodes[i]);
    }
    drawNodeEmoji(coreNode);

    requestAnimationFrame(draw);
  }

  function drawAmbient() {
    var cx = W / 2, cy = H / 2;

    // Subtle orbit circles
    for (var ri = 1; ri <= 3; ri++) {
      var rr = Math.min(W, H) * 0.12 * ri;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,200,255,' + (0.03 / ri) + ')';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Scanning arcs
    var a1 = phase * 1.2;
    var outerR = Math.min(W, H) * 0.38;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, a1, a1 + 0.5);
    ctx.strokeStyle = 'rgba(0,200,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, a1 + Math.PI, a1 + Math.PI + 0.3);
    ctx.stroke();
  }

  function drawEdges() {
    for (var ei = 0; ei < edges.length; ei++) {
      var edge = edges[ei];
      var from = findNode(edge.from);
      var to = findNode(edge.to);
      if (!from || !to) continue;

      var c = clipEdge(from, to);
      if (!c) continue;

      ctx.beginPath();
      ctx.moveTo(c.x1, c.y1);
      ctx.lineTo(c.x2, c.y2);

      if (edge.active) {
        var grad = ctx.createLinearGradient(c.x1, c.y1, c.x2, c.y2);
        grad.addColorStop(0, 'rgba(180,74,255,0.2)');
        grad.addColorStop(1, 'rgba(0,255,136,0.2)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Data packets
        for (var p = 0; p < 2; p++) {
          var t = ((phase * 2 + p * 0.5) % 1);
          var px = c.x1 + (c.x2 - c.x1) * t;
          var py = c.y1 + (c.y2 - c.y1) * t;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,255,136,0.7)';
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(42,58,74,0.18)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawNodeEffects(node) {
    var isCore = node.id === 'core';

    // Glow ring (stroke only, never fill)
    if (node.glowColor !== 'transparent') {
      var pulseR = Math.sin(phase * 2) * 3 + node.r + 14;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = node.glowColor;
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Core spinning rings
    if (isCore) {
      var ca = phase * 1.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + 22, ca, ca + 1.5);
      ctx.strokeStyle = 'rgba(180,74,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + 22, ca + Math.PI, ca + Math.PI + 1);
      ctx.strokeStyle = 'rgba(0,200,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Active spinning arcs
    if (node.status === 'active' && !isCore) {
      var sa = phase * 3;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + 16, sa, sa + 1);
      ctx.strokeStyle = 'rgba(0,255,136,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + 16, sa + Math.PI, sa + Math.PI + 0.7);
      ctx.strokeStyle = 'rgba(0,200,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawNodeEmoji(node) {
    var isCore = node.id === 'core';

    // Emoji
    ctx.font = node.emojiSize + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.emoji, node.x, node.y);

    // Token count
    if (!isCore && node.tokens > 0) {
      ctx.fillStyle = 'rgba(255,184,0,0.9)';
      ctx.font = "bold 15px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatK(node.tokens), node.x, node.y + node.r + 8);
    }

    // Name
    ctx.fillStyle = isCore ? '#b44aff' : '#d0e8ff';
    ctx.font = isCore ? "bold 18px 'Orbitron', monospace" : "bold 14px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var labelY = isCore ? node.y + node.r + 20 : node.y + node.r + 24;
    ctx.fillText(node.label, node.x, labelY);

    if (node.tool) {
      ctx.font = "13px 'SF Mono', monospace";
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('\u26A1' + node.tool, node.x, labelY + 18);
    }
  }

  draw();
})();
