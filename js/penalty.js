
// ===== PENALTY SHOOTOUT - ركلات الترجيح =====
class PenaltyShootout {
  constructor(canvas, renderer, audio) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.audio = audio;
    this.homeScores = [];
    this.awayScores = [];
    this.round = 0;
    this.maxRounds = 5;
    this.currentTeam = 'home';
    this.phase = 'aim';
    this.aimX = 0.5; this.aimY = 0.5;
    this.aimTimer = 0;
    this.aimSpeed = 0.8;
    this.aimDir = 1;
    this.result = null;
    this.resultTimer = 0;
    this.running = true;
    this.done = false;

    this.ball = new Ball();
    this.ball.x = 0.5; this.ball.y = 0.72;

    this.gkX = 0.5; this.gkY = 0.15;
    this.gkDir = 1; this.gkSpeed = 1.2;

    this.loop(performance.now());
  }

  update(dt) {
    if (this.phase === 'aim') {
      this.aimX += this.aimDir * this.aimSpeed * dt;
      if (this.aimX > 0.72 || this.aimX < 0.28) this.aimDir *= -1;
      // GK swings
      this.gkX += this.gkDir * this.gkSpeed * dt;
      if (this.gkX > 0.72 || this.gkX < 0.28) this.gkDir *= -1;
    }
    if (this.phase === 'shooting') {
      this.ball.update(dt);
      const dist = Math.hypot(this.ball.x - 0.5, this.ball.y - 0.15);
      if (this.ball.y <= 0.17) {
        const saved = Math.abs(this.gkX - this.ball.x) < 0.1;
        this.resolveKick(!saved);
      }
    }
    if (this.resultTimer > 0) {
      this.resultTimer -= dt;
      if (this.resultTimer <= 0) {
        this.result = null;
        this.nextTurn();
      }
    }
  }

  shoot() {
    if (this.phase !== 'aim') return;
    this.phase = 'shooting';
    const targetX = this.aimX;
    const dx = targetX - this.ball.x, dy = 0.15 - this.ball.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.ball.kick((dx / dist) * 1.5, (dy / dist) * 1.5);
    // GK dives
    this.gkDiveDir = Math.random() > 0.5 ? 1 : -1;
    this.audio.kick();
  }

  resolveKick(scored) {
    this.phase = 'result';
    if (scored) {
      if (this.currentTeam === 'home') this.homeScores.push(1);
      else this.awayScores.push(1);
      this.result = '⚽ هدف!';
      this.audio.goal();
    } else {
      if (this.currentTeam === 'home') this.homeScores.push(0);
      else this.awayScores.push(0);
      this.result = '🧤 تصدّى الحارس!';
    }
    this.resultTimer = 2;
    this.updatePenaltyUI();
  }

  nextTurn() {
    this.ball.x = 0.5; this.ball.y = 0.72;
    this.ball.vx = 0; this.ball.vy = 0;
    if (this.currentTeam === 'home') {
      this.currentTeam = 'away';
    } else {
      this.currentTeam = 'home';
      this.round++;
    }
    if (this.round >= this.maxRounds || this.isDecided()) {
      this.done = true;
      this.showFinalResult();
      return;
    }
    this.phase = 'aim';
    if (this.currentTeam === 'away') this.aiShoot();
  }

  aiShoot() {
    setTimeout(() => {
      if (this.phase === 'aim') {
        this.aimX = 0.28 + Math.random() * 0.44;
        this.shoot();
      }
    }, 1200);
  }

  isDecided() {
    const h = this.homeScores.reduce((a, b) => a + b, 0);
    const a = this.awayScores.reduce((a, b) => a + b, 0);
    const remH = this.maxRounds - this.homeScores.length;
    const remA = this.maxRounds - this.awayScores.length;
    if (h > a + remA) return true;
    if (a > h + remH) return true;
    return false;
  }

  updatePenaltyUI() {
    const hEl = document.getElementById('penaltyHome');
    const aEl = document.getElementById('penaltyAway');
    if (hEl) hEl.innerHTML = this.homeScores.map(s => s ? '✅' : '❌').join(' ');
    if (aEl) aEl.innerHTML = this.awayScores.map(s => s ? '✅' : '❌').join(' ');
  }

  showFinalResult() {
    const h = this.homeScores.reduce((a, b) => a + b, 0);
    const a = this.awayScores.reduce((a, b) => a + b, 0);
    setTimeout(() => {
      if (typeof showPenaltyResult === 'function') showPenaltyResult(h, a);
    }, 1500);
  }

  draw(renderer) {
    const ctx = renderer.ctx;
    const W = renderer.canvas.width, H = renderer.canvas.height;
    const cx = W / 2, cy = H / 2;

    // Field
    ctx.fillStyle = '#1e4d1e';
    ctx.fillRect(0, 0, W, H);

    // Penalty area
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    const paw = W * 0.5, pah = H * 0.45;
    ctx.strokeRect(cx - paw / 2, H * 0.1, paw, pah);

    // Goal
    const gw = W * 0.35, gh = H * 0.12;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(cx - gw / 2, H * 0.1, gw, gh);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - gw / 2, H * 0.1, gw, gh);

    // Aim crosshair
    if (this.phase === 'aim') {
      const ax = this.aimX * W, ay = H * 0.18;
      ctx.strokeStyle = this.currentTeam === 'home' ? '#e63946' : '#2196F3';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ax - 20, ay); ctx.lineTo(ax + 20, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay - 20); ctx.lineTo(ax, ay + 20); ctx.stroke();
      ctx.beginPath(); ctx.arc(ax, ay, 18, 0, Math.PI * 2); ctx.stroke();
    }

    // GK
    const gkScreenX = this.gkX * W;
    ctx.fillStyle = '#ff9800';
    ctx.beginPath(); ctx.arc(gkScreenX, H * 0.2, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GK', gkScreenX, H * 0.2);

    // Ball
    const bx = this.ball.x * W, by = this.ball.y * H;
    const grad = ctx.createRadialGradient(bx - 4, by - 4, 1, bx, by, 12);
    grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#888');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI * 2); ctx.fill();

    // Result
    if (this.result) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(cx - 150, cy - 40, 300, 80);
      ctx.fillStyle = this.result.includes('هدف') ? '#ffea00' : '#ff6b6b';
      ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.result, cx, cy);
    }

    // Shoot instruction
    if (this.phase === 'aim' && this.currentTeam === 'home') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
      ctx.fillText('اضغط Space للتسديد!', cx, H * 0.85);
    }
  }

  loop(ts) {
    if (!this.running) return;
    if (!this._last) this._last = ts;
    const dt = Math.min((ts - this._last) / 1000, 0.05);
    this._last = ts;
    this.update(dt);
    this.renderer.clear();
    this.draw(this.renderer);
    requestAnimationFrame(t => this.loop(t));
  }
}
