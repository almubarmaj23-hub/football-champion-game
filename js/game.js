
// ===== GAME ENGINE - المحرك الرئيسي =====
let game = null;
let difficulty = 'medium';

class FootballGame {
  constructor(diff) {
    this.difficulty = diff;
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.audio = new AudioEngine();
    this.audio.init();
    this.ball = new Ball();
    this.players = [];
    this.ai = new AIEngine(diff);
    this.homeScore = 0; this.awayScore = 0;
    this.gameTime = 0;
    this.matchDuration = 5 * 60; // 5 minutes per half
    this.half = 1;
    this.paused = false;
    this.running = false;
    this.lastTime = null;
    this.particles = [];
    this.goalCooldown = 0;
    this.stats = { homeShoots: 0, awayShoots: 0, homePoss: 50, awayPoss: 50 };
    this.poss_timer = 0;

    this.input = {
      up: false, down: false, left: false, right: false,
      shoot: false, tackle: false, pass: false, sprint: false
    };

    this.initPlayers();
    this.setupInput();
    this.setupMobileControls();
    this.loop(performance.now());
  }

  initPlayers() {
    this.players = [];
    // HOME (red) - left side attacking right
    const homeFormation = [
      [0.08, 0.5],  // GK
      [0.18, 0.2], [0.18, 0.4], [0.18, 0.6], [0.18, 0.8],  // DEF
      [0.32, 0.25], [0.32, 0.5], [0.32, 0.75],              // MID
      [0.42, 0.2], [0.42, 0.5], [0.42, 0.8]                 // ATT
    ];
    homeFormation.forEach(([x, y], i) => {
      const p = new Player('home', i + 1, x, y);
      if (i === 10) { p.isControlled = true; this.controlled = p; }
      this.players.push(p);
    });

    // AWAY (blue) - right side attacking left
    const awayFormation = [
      [0.92, 0.5],
      [0.82, 0.2], [0.82, 0.4], [0.82, 0.6], [0.82, 0.8],
      [0.68, 0.25], [0.68, 0.5], [0.68, 0.75],
      [0.58, 0.2], [0.58, 0.5], [0.58, 0.8]
    ];
    awayFormation.forEach(([x, y], i) => {
      this.players.push(new Player('away', i + 1, x, y));
    });
  }

  setupInput() {
    const keyMap = {
      'ArrowUp': 'up', 'ArrowDown': 'down',
      'ArrowLeft': 'left', 'ArrowRight': 'right',
      ' ': 'shoot', 'z': 'shoot', 'Z': 'shoot',
      'x': 'tackle', 'X': 'tackle',
      'c': 'pass', 'C': 'pass',
      'Shift': 'sprint'
    };
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter') { this.togglePause(); return; }
      if (e.key in keyMap) {
        e.preventDefault();
        const action = keyMap[e.key];
        this.input[action] = true;
        if (action === 'shoot') this.handleShoot();
        if (action === 'tackle') this.handleTackle();
        if (action === 'pass') this.handlePass();
      }
    });
    document.addEventListener('keyup', e => {
      if (e.key in keyMap) this.input[keyMap[e.key]] = false;
    });
  }

  setupMobileControls() {
    document.querySelectorAll('[data-key]').forEach(btn => {
      const key = btn.dataset.key;
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        this.simulateKey(key, true);
      });
      btn.addEventListener('touchend', e => {
        e.preventDefault();
        this.simulateKey(key, false);
      });
    });
  }

  simulateKey(key, down) {
    const keyMap = {
      'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
      ' ': 'shoot', 'x': 'tackle', 'c': 'pass'
    };
    if (key in keyMap) {
      this.input[keyMap[key]] = down;
      if (down && keyMap[key] === 'shoot') this.handleShoot();
      if (down && keyMap[key] === 'tackle') this.handleTackle();
      if (down && keyMap[key] === 'pass') this.handlePass();
    }
  }

  handleShoot() {
    if (!this.controlled) return;
    const p = this.controlled;
    const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
    if (dist < 0.1) {
      const goalX = 0.99, goalY = 0.5;
      const spread = 0.12;
      p.shoot(this.ball, goalX, goalY + (Math.random() - 0.5) * spread);
      this.stats.homeShoots++;
      this.audio.kick();
    }
  }

  handleTackle() {
    if (!this.controlled || this.controlled.tackle_cd > 0) return;
    const cp = this.controlled;
    const nearestEnemy = this.players
      .filter(p => p.team === 'away')
      .sort((a, b) => Math.hypot(a.x - cp.x, a.y - cp.y) - Math.hypot(b.x - cp.x, b.y - cp.y))[0];
    if (nearestEnemy && Math.hypot(nearestEnemy.x - cp.x, nearestEnemy.y - cp.y) < 0.08) {
      // Steal ball if near
      if (Math.hypot(this.ball.x - nearestEnemy.x, this.ball.y - nearestEnemy.y) < 0.06) {
        this.ball.vx = -this.ball.vx * 0.5;
        this.ball.vy += (Math.random() - 0.5) * 0.3;
        this.ball.lastTouched = cp;
        this.audio.tackle();
      }
      cp.tackle_cd = 0.8;
    }
  }

  handlePass() {
    if (!this.controlled) return;
    const cp = this.controlled;
    const dist = Math.hypot(cp.x - this.ball.x, cp.y - this.ball.y);
    if (dist < 0.1) {
      const teammates = this.players.filter(p => p.team === 'home' && p !== cp);
      const best = teammates
        .filter(t => t.x > cp.x - 0.1)
        .sort((a, b) => {
          const da = Math.hypot(a.x - 0.99, a.y - 0.5);
          const db = Math.hypot(b.x - 0.99, b.y - 0.5);
          return da - db;
        })[0];
      if (best) {
        cp.pass(this.ball, best.x, best.y);
        this.audio.kick();
        // Switch control to receiver after short delay
        setTimeout(() => {
          if (this.controlled) this.controlled.isControlled = false;
          this.controlled = best;
          best.isControlled = true;
        }, 600);
      }
    }
  }

  switchControl() {
    // Auto-switch to player closest to ball
    const homePlayers = this.players.filter(p => p.team === 'home');
    const nearest = homePlayers.sort((a, b) =>
      Math.hypot(a.x - this.ball.x, a.y - this.ball.y) -
      Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
    )[0];
    if (nearest && nearest !== this.controlled) {
      if (this.controlled) this.controlled.isControlled = false;
      this.controlled = nearest;
      nearest.isControlled = true;
    }
  }

  checkGoal() {
    const b = this.ball;
    if (this.goalCooldown > 0) return;
    const goalH = 0.18;
    // Home scores (ball crosses right boundary)
    if (b.x > 0.99 && Math.abs(b.y - 0.5) < goalH / 2) {
      this.homeScore++;
      this.onGoal('home');
    }
    // Away scores (ball crosses left boundary)
    if (b.x < 0.01 && Math.abs(b.y - 0.5) < goalH / 2) {
      this.awayScore++;
      this.onGoal('away');
    }
  }

  onGoal(team) {
    this.goalCooldown = 3;
    this.audio.goal();
    this.audio.whistle();
    document.getElementById('scoreHome').textContent = this.homeScore;
    document.getElementById('scoreAway').textContent = this.awayScore;
    document.getElementById('goalScorer').textContent = team === 'home' ? '🔴 فريقك سجّل!' : '🔵 الخصم سجّل!';
    document.getElementById('goalOverlay').classList.remove('hidden');
    this.spawnGoalParticles();
    setTimeout(() => {
      document.getElementById('goalOverlay').classList.add('hidden');
      this.ball.reset();
      this.resetPositions();
    }, 2500);
  }

  resetPositions() {
    this.initPlayers();
  }

  spawnGoalParticles() {
    const { x, y, w, h } = this.renderer.fieldRect;
    const cx = x + w / 2, cy = y + h / 2;
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const colors = ['#ffea00', '#ff1744', '#00e676', '#40c4ff', '#e040fb', '#ff9800'];
      this.particles.push({
        x: cx + (Math.random() - 0.5) * w * 0.5,
        y: cy + (Math.random() - 0.5) * h * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 4 + Math.random() * 8,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }
  }

  updateParticles(dt) {
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.alpha -= 1.2 * dt;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  updateTime(dt) {
    if (this.goalCooldown > 0) { this.goalCooldown -= dt; return; }
    this.gameTime += dt;
    const halfDur = this.matchDuration;
    if (this.gameTime >= halfDur && this.half === 1) {
      this.half = 2;
      this.gameTime = 0;
      document.getElementById('halfIndicator').textContent = 'الشوط الثاني';
      this.ball.reset();
      this.resetPositions();
      this.audio.whistle();
    }
    if (this.gameTime >= halfDur && this.half === 2) {
      this.running = false;
      endGame();
      return;
    }
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const half_offset = this.half === 2 ? 45 : 0;
    document.getElementById('gameTime').textContent =
      `${String(half_offset + minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  updatePossession(dt) {
    this.poss_timer += dt;
    if (this.poss_timer > 0.5) {
      this.poss_timer = 0;
      const nearest = this.players.sort((a, b) =>
        Math.hypot(a.x - this.ball.x, a.y - this.ball.y) -
        Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
      )[0];
      if (nearest) {
        if (nearest.team === 'home') this.stats.homePoss = Math.min(80, this.stats.homePoss + 1);
        else this.stats.homePoss = Math.max(20, this.stats.homePoss - 1);
        this.stats.awayPoss = 100 - this.stats.homePoss;
      }
    }
  }

  loop(ts) {
    if (!this.running) return;
    if (!this.lastTime) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    if (!this.paused) {
      this.updateTime(dt);
      this.ball.update(dt);

      // Update home players
      this.players.filter(p => p.team === 'home').forEach(p => {
        p.update(dt, p.isControlled ? this.input : {}, this.ball);
      });

      // Auto-switch control
      if (Math.random() < 0.01) this.switchControl();

      // AI updates away players
      this.ai.update(dt, this.players, this.ball, this.homeScore, this.awayScore);

      this.checkGoal();
      this.updateParticles(dt);
      this.updatePossession(dt);
    }

    // Render
    const ctx = this.renderer.ctx;
    this.renderer.clear();
    this.renderer.drawField();

    // Draw all players
    this.players.forEach(p => this.renderer.drawPlayer(p));

    // Draw ball
    this.renderer.drawBall(this.ball);

    // Particles
    if (this.particles.length > 0) {
      this.renderer.drawParticles(this.particles);
    }

    requestAnimationFrame(ts => this.loop(ts));
  }

  togglePause() {
    this.paused = !this.paused;
    document.getElementById('pauseOverlay').classList.toggle('hidden', !this.paused);
  }
}

// ===== GLOBAL FUNCTIONS =====
function startGame(diff) {
  difficulty = diff;
  showScreen('gameScreen');
  if (game) game.running = false;
  game = new FootballGame(diff);
  game.running = true;
  document.getElementById('scoreHome').textContent = '0';
  document.getElementById('scoreAway').textContent = '0';
  document.getElementById('gameTime').textContent = '00:00';
  document.getElementById('halfIndicator').textContent = 'الشوط الأول';
}

function resumeGame() {
  if (game) game.paused = false;
  document.getElementById('pauseOverlay').classList.add('hidden');
}

function endGame() {
  if (game) { game.running = false; game.paused = false; }
  const h = game ? game.homeScore : 0;
  const a = game ? game.awayScore : 0;
  document.getElementById('finalHome').textContent = h;
  document.getElementById('finalAway').textContent = a;

  let title, msg, trophy;
  if (h > a) { title = '🏆 أنت الفائز!'; msg = 'أداء رائع! لقد تغلبت على الخصم'; trophy = '🏆'; }
  else if (a > h) { title = '😔 خسرت المباراة'; msg = 'حاول مرة أخرى، أنت قادر على الفوز!'; trophy = '🥈'; }
  else { title = '🤝 تعادل!'; msg = 'مباراة متكافئة جداً!'; trophy = '🤝'; }

  document.getElementById('endTitle').textContent = title;
  document.getElementById('endMessage').textContent = msg;
  document.getElementById('trophyIcon').textContent = trophy;

  const stats = game ? game.stats : { homeShoots: 0, awayShoots: 0, homePoss: 50, awayPoss: 50 };
  document.getElementById('endStats').innerHTML = `
    <div class="stat-item">⚽ تسديداتك<br/><strong>${stats.homeShoots}</strong></div>
    <div class="stat-item">🎯 تسديدات الخصم<br/><strong>${stats.awayShoots || 0}</strong></div>
    <div class="stat-item">🔴 استحواذك<br/><strong>${stats.homePoss}%</strong></div>
    <div class="stat-item">🔵 استحواذ الخصم<br/><strong>${stats.awayPoss}%</strong></div>
  `;

  showScreen('endScreen');
}

function restartGame() { startGame(difficulty); }
function showMenu() { if (game) game.running = false; showScreen('mainMenu'); }
function showControls() { showScreen('controlsScreen'); }
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
