// Sci-fi particle system with hex grid + floating orbs
(function() {
  var canvas = document.getElementById('particleBg');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var W, H;
  var activeCount = 0;
  var mouseX = -999, mouseY = -999;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Mouse tracking for interactive glow
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function createParticle() {
    var type = Math.random();
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: type > 0.8 ? Math.random() * 2.5 + 1 : Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.3 + 0.05,
      // Color palette: cyan, blue, purple
      color: type > 0.7 ? '180,74,255' : type > 0.3 ? '0,200,255' : '0,229,255',
      phase: Math.random() * Math.PI * 2,
      bright: type > 0.9 // some particles are brighter
    };
  }

  for (var i = 0; i < 100; i++) particles.push(createParticle());

  var frame = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Draw hex grid (subtle)
    drawHexGrid();

    // Draw connections (only nearby)
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = dx * dx + dy * dy;
        if (dist < 14400) { // 120px
          var d = Math.sqrt(dist);
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0,200,255,' + (0.06 * (1 - d / 120)) + ')';
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (var k = 0; k < particles.length; k++) {
      var p = particles[k];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // Breathing alpha
      var breathe = Math.sin(frame * 0.01 + p.phase) * 0.1;
      var a = Math.max(0.02, p.alpha + breathe);

      // Mouse proximity glow
      var mdx = p.x - mouseX;
      var mdy = p.y - mouseY;
      var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 150) {
        a += (1 - mdist / 150) * 0.3;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.color + ',' + a + ')';
      ctx.fill();

      // Bright particles get a glow
      if (p.bright) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color + ',' + (a * 0.15) + ')';
        ctx.fill();
      }
    }

    // Scanning line
    var scanY = (frame * 0.5) % H;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(W, scanY);
    var grad = ctx.createLinearGradient(0, scanY, W, scanY);
    grad.addColorStop(0, 'rgba(0,200,255,0)');
    grad.addColorStop(0.5, 'rgba(0,200,255,0.04)');
    grad.addColorStop(1, 'rgba(0,200,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.stroke();

    requestAnimationFrame(draw);
  }

  function drawHexGrid() {
    var size = 40;
    var h = size * Math.sqrt(3);
    ctx.strokeStyle = 'rgba(0,200,255,0.02)';
    ctx.lineWidth = 0.5;

    for (var row = -1; row < H / h + 1; row++) {
      for (var col = -1; col < W / (size * 3) + 1; col++) {
        var cx = col * size * 3 + (row % 2 ? size * 1.5 : 0);
        var cy = row * h * 0.5;
        drawHex(cx, cy, size * 0.5);
      }
    }
  }

  function drawHex(cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 3 * i - Math.PI / 6;
      var x = cx + r * Math.cos(angle);
      var y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  draw();

  window.setParticleActivity = function(count) {
    activeCount = count;
    var target = 80 + count * 25;
    while (particles.length < target && particles.length < 200) particles.push(createParticle());
    while (particles.length > target && particles.length > 50) particles.pop();
    var speed = count > 0 ? 0.4 : 0.2;
    for (var i = 0; i < particles.length; i++) {
      particles[i].vx = (Math.random() - 0.5) * speed;
      particles[i].vy = (Math.random() - 0.5) * speed;
    }
  };
})();
