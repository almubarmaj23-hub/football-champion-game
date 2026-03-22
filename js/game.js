
// ===== TEAMS DATA =====
const TEAMS = [
  { name:'النسور', emoji:'🦅', color:'#e63946', rating:88 },
  { name:'الأسود', emoji:'🦁', color:'#ff9800', rating:90 },
  { name:'النجوم', emoji:'⭐', color:'#ffea00', rating:85 },
  { name:'العقاب', emoji:'🦆', color:'#9c27b0', rating:87 },
  { name:'الصواعق', emoji:'⚡', color:'#00bcd4', rating:86 },
  { name:'التنانين', emoji:'🐉', color:'#f44336', rating:92 },
  { name:'الرياح', emoji:'💨', color:'#4caf50', rating:84 },
  { name:'البرق',  emoji:'🌩️', color:'#607d8b', rating:89 },
];

const FORMATIONS = {
  '4-3-3': {
    home: [[.08,.5],[.18,.18],[.18,.40],[.18,.60],[.18,.82],[.32,.27],[.32,.5],[.32,.73],[.44,.18],[.44,.5],[.44,.82]],
    away: [[.92,.5],[.82,.18],[.82,.40],[.82,.60],[.82,.82],[.68,.27],[.68,.5],[.68,.73],[.56,.18],[.56,.5],[.56,.82]],
  },
  '4-4-2': {
    home: [[.08,.5],[.18,.18],[.18,.40],[.18,.60],[.18,.82],[.30,.15],[.30,.40],[.30,.60],[.30,.85],[.42,.33],[.42,.67]],
    away: [[.92,.5],[.82,.18],[.82,.40],[.82,.60],[.82,.82],[.70,.15],[.70,.40],[.70,.60],[.70,.85],[.58,.33],[.58,.67]],
  },
  '5-3-2': {
    home: [[.08,.5],[.16,.12],[.16,.32],[.16,.5],[.16,.68],[.16,.88],[.30,.27],[.30,.5],[.30,.73],[.42,.33],[.42,.67]],
    away: [[.92,.5],[.84,.12],[.84,.32],[.84,.5],[.84,.68],[.84,.88],[.70,.27],[.70,.5],[.70,.73],[.58,.33],[.58,.67]],
  },
  '3-5-2': {
    home: [[.08,.5],[.16,.25],[.16,.5],[.16,.75],[.28,.12],[.28,.32],[.28,.5],[.28,.68],[.28,.88],[.40,.33],[.40,.67]],
    away: [[.92,.5],[.84,.25],[.84,.5],[.84,.75],[.72,.12],[.72,.32],[.72,.5],[.72,.68],[.72,.88],[.60,.33],[.60,.67]],
  }
};

// ===== GAME STATE =====
let game = null;
let difficulty = 'medium';
let matchDurationMin = 3;
let selectedHomeTeam = 0;
let selectedFormation = '4-3-3';
let penaltyGame = null;
let tournament = null;

// ===== TEAM SELECT =====
function showTeamSelect() {
  showScreen('teamSelectScreen');
  const grid = document.getElementById('teamsGrid');
  grid.innerHTML = TEAMS.map((t,i) => `
    <div class="team-card-select ${i===selectedHomeTeam?'selected':''}" onclick="selectTeam(${i})">
      <span class="t-emoji">${t.emoji}</span>
      <div class="t-name">${t.name}</div>
      <div class="t-rating">★ ${t.rating}</div>
    </div>
  `).join('');

  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.diff === difficulty);
    b.onclick = () => {
      difficulty = b.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    };
  });
  document.querySelectorAll('.time-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.time) === matchDurationMin);
    b.onclick = () => {
      matchDurationMin = parseInt(b.dataset.time);
      document.querySelectorAll('.time-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    };
  });
}

function selectTeam(idx) {
  selectedHomeTeam = idx;
  document.querySelectorAll('.team-card-select').forEach((c,i) => c.classList.toggle('selected', i===idx));
}

function startSelectedGame() {
  const team = TEAMS[selectedHomeTeam];
  startGame(difficulty, team, matchDurationMin);
}

// ===== TOURNAMENT =====
function showTournament() {
  showScreen('tournamentScreen');
  tournament = {
    teams: [...TEAMS].sort(() => Math.random()-.5).slice(0,4),
    matches: [], currentMatch: 0, phase: 'semi'
  };
  tournament.matches = [
    { home: tournament.teams[0], away: tournament.teams[1], score: null },
    { home: tournament.teams[2], away: tournament.teams[3], score: null },
    { home: null, away: null, score: null, isFinal: true }
  ];
  renderBracket();
}

function renderBracket() {
  const b = document.getElementById('bracket');
  b.innerHTML = tournament.matches.map((m,i) => {
    const isDone = m.score !== null;
    const isActive = i === tournament.currentMatch && !isDone;
    const label = i < 2 ? `نصف النهائي ${i+1}` : '🏆 النهائي';
    const h = m.home ? `${m.home.emoji} ${m.home.name}` : 'الفائز 1';
    const a = m.away ? `${m.away.emoji} ${m.away.name}` : 'الفائز 2';
    const score = isDone ? `<div class="bm-score">${m.score[0]} - ${m.score[1]}</div>` : '';
    return `<div class="bracket-match ${isActive?'active':''} ${isDone?'done':''}">
      <div style="font-size:11px;color:var(--yellow);margin-bottom:6px">${label}</div>
      <div class="bm-teams"><span>${h}</span><span>${a}</span></div>
      ${score}
    </div>`;
  }).join('');

  const cur = tournament.matches[tournament.currentMatch];
  const status = document.getElementById('tournamentStatus');
  if (cur && cur.score === null && cur.home) {
    status.textContent = `المباراة التالية: ${cur.home.emoji} ${cur.home.name}  vs  ${cur.away.emoji} ${cur.away.name}`;
  } else if (tournament.currentMatch >= tournament.matches.length) {
    const final = tournament.matches[2];
    const winner = final.score[0] > final.score[1] ? final.home : final.away;
    status.innerHTML = `🏆 بطل البطولة: ${winner.emoji} <strong>${winner.name}</strong>!`;
    document.getElementById('nextMatchBtn').style.display = 'none';
  }
}

function playNextMatch() {
  const m = tournament.matches[tournament.currentMatch];
  if (!m || !m.home) return;
  selectedHomeTeam = TEAMS.indexOf(m.home);
  if (selectedHomeTeam < 0) selectedHomeTeam = 0;
  startGame(difficulty, m.home, 3, m.away, true);
}

function onTournamentMatchEnd(homeScore, awayScore) {
  const m = tournament.matches[tournament.currentMatch];
  m.score = [homeScore, awayScore];
  const winner = homeScore >= awayScore ? m.home : m.away;
  const loser  = homeScore >= awayScore ? m.away : m.home;
  if (tournament.currentMatch === 0) tournament.matches[2].home = winner;
  if (tournament.currentMatch === 1) tournament.matches[2].away = winner;
  tournament.currentMatch++;
  showScreen('tournamentScreen');
  renderBracket();
}

// ===== PENALTY MODE =====
function showPenaltyMode() {
  showScreen('penaltyScreen');
  const canvas = document.getElementById('penaltyCanvas');
  const renderer = new Renderer(canvas);
  const audio = new AudioEngine(); audio.init();
  penaltyGame = new PenaltyShootout(canvas, renderer, audio);
  window.showPenaltyResult = (h, a) => {
    document.getElementById('finalHome').textContent = h;
    document.getElementById('finalAway').textContent  = a;
    document.getElementById('endHomeTeam').textContent = 'أنت';
    document.getElementById('endAwayTeam').textContent = 'الخصم';
    document.getElementById('endTitle').textContent = h > a ? '🏆 فزت بركلات الترجيح!' : h < a ? '😔 خسرت الركلات' : '🤝 تعادل الركلات';
    document.getElementById('endMessage').textContent = `${h} - ${a}`;
    document.getElementById('trophyIcon').textContent = h > a ? '🏆' : '🥈';
    document.getElementById('endStats').innerHTML = '';
    showScreen('endScreen');
  };
  document.addEventListener('keydown', function penaltyKey(e) {
    if (e.key === ' ' || e.key === 'z' || e.key === 'Z') {
      if (penaltyGame && !penaltyGame.done) penaltyGame.shoot();
    }
    if (penaltyGame && penaltyGame.done) document.removeEventListener('keydown', penaltyKey);
  });
}

// ===== FORMATIONS =====
function showFormationPicker() {
  document.getElementById('formationPicker').classList.remove('hidden');
  document.querySelectorAll('.form-btn').forEach(b => b.classList.toggle('active', b.textContent.startsWith(selectedFormation)));
}
function closeFormation() { document.getElementById('formationPicker').classList.add('hidden'); }
function setFormation(f) {
  selectedFormation = f;
  document.getElementById('formationBadge').textContent = f;
  document.querySelectorAll('.form-btn').forEach(b => b.classList.toggle('active', b.textContent.startsWith(f)));
  if (game) { game.rebuildFormation(f); }
}

// ===== MAIN GAME CLASS =====
class FootballGame {
  constructor(diff, homeTeam, durationMin, awayTeam, isTournament) {
    this.difficulty = diff;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam || TEAMS.find((t,i) => i !== TEAMS.indexOf(homeTeam)) || TEAMS[1];
    this.isTournament = isTournament || false;
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.audio = new AudioEngine(); this.audio.init();
    this.ball = new Ball();
    this.players = [];
    this.gkHome = null; this.gkAway = null;
    this.ai = new AIEngine(diff);
    this.referee = new Referee();
    this.homeScore = 0; this.awayScore = 0;
    this.gameTime = 0;
    this.matchDuration = durationMin * 60;
    this.half = 1;
    this.paused = false;
    this.running = false;
    this.lastTime = null;
    this.particles = [];
    this.goalCooldown = 0;
    this.formation = selectedFormation;
    this.stats = { homeShoots:0, awayShoots:0, homePoss:50, awayPoss:50, homeGoals:0, awayGoals:0, saves:0 };
    this.poss_timer = 0;
    this.events = [];
    this.input = { up:false, down:false, left:false, right:false, shoot:false, tackle:false, pass:false, sprint:false };
    this.controlled = null;

    this.initPlayers(this.formation);
    this.setupInput();
    this.setupMobileControls();
    this.updateHUDTeams();
    this.loop(performance.now());
  }

  updateHUDTeams() {
    document.getElementById('homeEmblem').textContent = this.homeTeam.emoji;
    document.getElementById('awayEmblem').textContent = this.awayTeam.emoji;
    document.getElementById('homeTeamName').textContent = this.homeTeam.name;
    document.getElementById('awayTeamName').textContent = this.awayTeam.name;
    document.getElementById('homeCards').textContent = '';
    document.getElementById('awayCards').textContent = '';
  }

  initPlayers(formation) {
    this.players = [];
    const pos = FORMATIONS[formation] || FORMATIONS['4-3-3'];
    pos.home.forEach(([x,y],i) => {
      const p = i === 0 ? new Goalkeeper('home', x, y) : new Player('home', i+1, x, y);
      if (i === 0) this.gkHome = p;
      if (i === 10) { p.isControlled = true; this.controlled = p; }
      this.players.push(p);
    });
    pos.away.forEach(([x,y],i) => {
      const p = i === 0 ? new Goalkeeper('away', x, y) : new Player('away', i+1, x, y);
      if (i === 0) this.gkAway = p;
      this.players.push(p);
    });
    document.getElementById('formationBadge').textContent = formation;
  }

  rebuildFormation(f) {
    this.formation = f;
    this.initPlayers(f);
  }

  setupInput() {
    const km = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', ' ':'shoot', z:'shoot', Z:'shoot', x:'tackle', X:'tackle', c:'pass', C:'pass', Shift:'sprint', Tab:'switch' };
    document.addEventListener('keydown', this._kd = e => {
      if (e.key === 'Enter') { this.togglePause(); return; }
      if (e.key === 'q' || e.key === 'Q') { showFormationPicker(); return; }
      if (e.key in km) {
        e.preventDefault();
        const a = km[e.key];
        this.input[a] = true;
        if (a==='shoot')  this.handleShoot();
        if (a==='tackle') this.handleTackle();
        if (a==='pass')   this.handlePass();
        if (a==='switch') this.switchControl();
      }
    });
    document.addEventListener('keyup', this._ku = e => {
      if (e.key in km) this.input[km[e.key]] = false;
    });
  }

  removeInput() {
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup', this._ku);
  }

  setupMobileControls() {
    document.querySelectorAll('[data-key]').forEach(btn => {
      btn.addEventListener('touchstart', e => { e.preventDefault(); this.simKey(btn.dataset.key, true); }, { passive:false });
      btn.addEventListener('touchend',   e => { e.preventDefault(); this.simKey(btn.dataset.key, false); }, { passive:false });
    });
  }

  simKey(key, down) {
    const km = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', ' ':'shoot', x:'tackle', c:'pass', Shift:'sprint', Tab:'switch' };
    if (key in km) {
      this.input[km[key]] = down;
      if (down && km[key]==='shoot')  this.handleShoot();
      if (down && km[key]==='tackle') this.handleTackle();
      if (down && km[key]==='pass')   this.handlePass();
      if (down && km[key]==='switch') this.switchControl();
    }
  }

  handleShoot() {
    if (!this.controlled) return;
    const p = this.controlled;
    const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
    if (dist < 0.1) {
      const goalX = 0.995, goalY = 0.5;
      const spread = this.difficulty==='easy' ? 0.07 : this.difficulty==='medium' ? 0.1 : 0.14;
      p.shoot(this.ball, goalX, goalY + (Math.random()-.5)*spread);
      this.stats.homeShoots++;
      this.audio.kick();
      this.addEvent('⚽ تسديدة', 'home');
    }
  }

  handleTackle() {
    if (!this.controlled || this.controlled.tackle_cd > 0) return;
    const cp = this.controlled;
    const ne = this.players.filter(p => p.team==='away').sort((a,b) =>
      Math.hypot(a.x-cp.x,a.y-cp.y) - Math.hypot(b.x-cp.x,b.y-cp.y))[0];
    if (ne && Math.hypot(ne.x-cp.x, ne.y-cp.y) < 0.09) {
      if (Math.hypot(this.ball.x-ne.x, this.ball.y-ne.y) < 0.07) {
        this.ball.vx = -this.ball.vx*.5;
        this.ball.vy += (Math.random()-.5)*.3;
        this.ball.lastTouched = cp;
        this.audio.tackle();
        this.addEvent('🦵 تدخل', 'home');
      }
      cp.tackle_cd = 0.8;
      this.referee.callFoul(ne, this.ball);
    }
  }

  handlePass() {
    if (!this.controlled) return;
    const cp = this.controlled;
    const dist = Math.hypot(cp.x - this.ball.x, cp.y - this.ball.y);
    if (dist < 0.12) {
      const best = this.players.filter(p => p.team==='home' && p !== cp)
        .filter(t => t.x > cp.x - .05)
        .sort((a,b) => Math.hypot(a.x-.99,a.y-.5) - Math.hypot(b.x-.99,b.y-.5))[0];
      if (best) {
        cp.pass(this.ball, best.x, best.y);
        this.audio.kick();
        this.addEvent('↗ تمريرة', 'home');
        setTimeout(() => {
          if (this.controlled) this.controlled.isControlled = false;
          this.controlled = best; best.isControlled = true;
        }, 700);
      }
    }
  }

  switchControl() {
    const hp = this.players.filter(p => p.team==='home');
    const nearest = hp.sort((a,b) =>
      Math.hypot(a.x-this.ball.x,a.y-this.ball.y) - Math.hypot(b.x-this.ball.x,b.y-this.ball.y))[0];
    if (nearest && nearest !== this.controlled) {
      if (this.controlled) this.controlled.isControlled = false;
      this.controlled = nearest; nearest.isControlled = true;
    }
  }

  addEvent(text, team) {
    const minutes = Math.floor(this.gameTime/60) + (this.half===2?45:0);
    this.events.push({ text, team, time: minutes + "'" });
  }

  checkGoal() {
    const b = this.ball;
    if (this.goalCooldown > 0) return;
    const gh = 0.18;
    if (b.x > 0.99 && Math.abs(b.y-.5) < gh/2) { this.homeScore++; this.onGoal('home'); }
    if (b.x < 0.01 && Math.abs(b.y-.5) < gh/2) { this.awayScore++; this.onGoal('away'); }
  }

  onGoal(team) {
    this.goalCooldown = 3;
    this.audio.goal(); this.audio.whistle();
    document.getElementById('scoreHome').textContent = this.homeScore;
    document.getElementById('scoreAway').textContent = this.awayScore;
    const scorer = team==='home' ? this.homeTeam : this.awayTeam;
    document.getElementById('goalScorer').textContent = `${scorer.emoji} ${scorer.name} سجّل!`;
    const minutes = Math.floor(this.gameTime/60) + (this.half===2?45:0);
    document.getElementById('goalMeta').textContent = `الدقيقة ${minutes}'`;
    document.getElementById('goalOverlay').classList.remove('hidden');
    this.addEvent('⚽ هدف!', team);
    this.spawnGoalParticles();
    setTimeout(() => {
      document.getElementById('goalOverlay').classList.add('hidden');
      this.ball.reset();
      this.initPlayers(this.formation);
    }, 2600);
  }

  spawnGoalParticles() {
    const { x, y, w, h } = this.renderer.fieldRect;
    const cx = x + w/2, cy = y + h/2;
    const cols = ['#ffea00','#ff1744','#00e676','#40c4ff','#e040fb','#ff9800','#fff'];
    for (let i=0; i<80; i++) {
      const ang = Math.random()*Math.PI*2, spd = 80+Math.random()*250;
      this.particles.push({
        x: cx+(Math.random()-.5)*w*.6, y: cy+(Math.random()-.5)*h*.4,
        vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
        r: 3+Math.random()*9, alpha:1, color:cols[Math.floor(Math.random()*cols.length)], life:1.2
      });
    }
  }

  updateParticles(dt) {
    this.particles.forEach(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=250*dt; p.alpha-=dt; p.life-=dt; });
    this.particles = this.particles.filter(p => p.life>0);
  }

  updateTime(dt) {
    if (this.goalCooldown>0) { this.goalCooldown-=dt; return; }
    this.gameTime+=dt;
    if (this.gameTime>=this.matchDuration && this.half===1) {
      this.half=2; this.gameTime=0;
      document.getElementById('halfIndicator').textContent='الشوط 2';
      this.ball.reset(); this.initPlayers(this.formation);
      this.audio.whistle();
    }
    if (this.gameTime>=this.matchDuration && this.half===2) {
      this.running=false; endGame(); return;
    }
    const off = this.half===2?45:0;
    const m = Math.floor(this.gameTime/60)+off;
    const s = Math.floor(this.gameTime%60);
    document.getElementById('gameTime').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  updatePossession(dt) {
    this.poss_timer+=dt;
    if (this.poss_timer>0.5) {
      this.poss_timer=0;
      const nearest = [...this.players].sort((a,b) =>
        Math.hypot(a.x-this.ball.x,a.y-this.ball.y) - Math.hypot(b.x-this.ball.x,b.y-this.ball.y))[0];
      if (nearest) {
        if (nearest.team==='home') this.stats.homePoss=Math.min(80,this.stats.homePoss+1);
        else this.stats.homePoss=Math.max(20,this.stats.homePoss-1);
        this.stats.awayPoss=100-this.stats.homePoss;
        document.getElementById('homePoss').style.width=this.stats.homePoss+'%';
        document.getElementById('awayPoss').style.width=this.stats.awayPoss+'%';
        document.getElementById('homeCards').textContent=this.referee.getCardBadge('home');
        document.getElementById('awayCards').textContent=this.referee.getCardBadge('away');
      }
    }
  }

  drawMiniMap() {
    const mc = document.getElementById('miniMap');
    const mctx = mc.getContext('2d');
    mc.width=120; mc.height=80;
    mctx.fillStyle='#1e4d1e';
    mctx.fillRect(0,0,120,80);
    mctx.strokeStyle='rgba(255,255,255,.4)';
    mctx.strokeRect(5,5,110,70);
    mctx.beginPath(); mctx.moveTo(60,5); mctx.lineTo(60,75); mctx.stroke();
    this.players.forEach(p => {
      mctx.fillStyle = p.team==='home' ? '#e63946' : '#2196F3';
      if (p.isControlled) mctx.fillStyle='#ffea00';
      mctx.beginPath(); mctx.arc(5+p.x*110, 5+p.y*70, 3, 0, Math.PI*2); mctx.fill();
    });
    mctx.fillStyle='#fff';
    mctx.beginPath(); mctx.arc(5+this.ball.x*110, 5+this.ball.y*70, 4, 0, Math.PI*2); mctx.fill();
  }

  loop(ts) {
    if (!this.running) return;
    if (!this.lastTime) this.lastTime=ts;
    const dt = Math.min((ts-this.lastTime)/1000, .05);
    this.lastTime=ts;

    if (!this.paused) {
      this.updateTime(dt);
      this.ball.update(dt);
      this.players.filter(p=>p.team==='home').forEach(p => {
        if (p.isGK) p.updateGK(dt, this.ball, this.renderer.fieldRect);
        else p.update(dt, p.isControlled?this.input:{}, this.ball);
      });
      if (Math.random()<.008) this.switchControl();
      this.ai.update(dt, this.players, this.ball, this.homeScore, this.awayScore);
      if (this.gkAway) this.gkAway.updateGK(dt, this.ball, this.renderer.fieldRect);
      this.referee.update(dt, this.players, this.ball);
      this.checkGoal();
      this.updateParticles(dt);
      this.updatePossession(dt);
    }

    this.renderer.clear();
    this.renderer.drawField();
    this.players.forEach(p => this.renderer.drawPlayer(p));
    this.renderer.drawBall(this.ball);
    if (this.particles.length) this.renderer.drawParticles(this.particles);
    this.drawMiniMap();
    requestAnimationFrame(ts => this.loop(ts));
  }

  togglePause() {
    this.paused=!this.paused;
    if (this.paused) {
      document.getElementById('pauseStats').innerHTML = `
        ⚽ تسديداتك: ${this.stats.homeShoots} | الاستحواذ: ${this.stats.homePoss}%<br/>
        اللاعبون: ${this.players.filter(p=>p.team==='home').length} | الشوط: ${this.half}
      `;
    }
    document.getElementById('pauseOverlay').classList.toggle('hidden', !this.paused);
  }
}

// ===== GLOBAL FUNCTIONS =====
function startGame(diff, homeTeam, durationMin, awayTeam, isTournament) {
  difficulty = diff || 'medium';
  homeTeam = homeTeam || TEAMS[selectedHomeTeam];
  durationMin = durationMin || matchDurationMin;
  showScreen('gameScreen');
  if (game) { game.running=false; game.removeInput(); }
  game = new FootballGame(diff, homeTeam, durationMin, awayTeam, isTournament);
  game.running = true;
  document.getElementById('scoreHome').textContent='0';
  document.getElementById('scoreAway').textContent='0';
  document.getElementById('gameTime').textContent='00:00';
  document.getElementById('halfIndicator').textContent='الشوط 1';
}

function resumeGame() {
  if (game) game.paused=false;
  document.getElementById('pauseOverlay').classList.add('hidden');
}

function endGame() {
  const h = game?game.homeScore:0, a = game?game.awayScore:0;
  if (game) { game.running=false; game.paused=false; game.removeInput(); }

  if (game && game.isTournament) { onTournamentMatchEnd(h, a); return; }

  document.getElementById('finalHome').textContent=h;
  document.getElementById('finalAway').textContent=a;
  const ht = game?game.homeTeam:TEAMS[0], at=game?game.awayTeam:TEAMS[1];
  document.getElementById('endHomeTeam').textContent=ht.name;
  document.getElementById('endAwayTeam').textContent=at.name;
  let title,msg,trophy;
  if (h>a){ title=`🏆 ${ht.emoji} ${ht.name} يفوز!`; msg='تهانينا! أداء رائع 🎉'; trophy='🏆'; }
  else if (a>h){ title=`${at.emoji} ${at.name} يفوز!`; msg='حاول مرة أخرى، أنت قادر! 💪'; trophy='🥈'; }
  else { title='🤝 تعادل!'; msg='مباراة متكافئة جداً!'; trophy='🤝'; }

  document.getElementById('endTitle').textContent=title;
  document.getElementById('endMessage').textContent=msg;
  document.getElementById('trophyIcon').textContent=trophy;

  const s = game?game.stats:{homeShoots:0,awayShoots:0,homePoss:50,awayPoss:50};
  const evs = game?game.events:[];
  const lastGoals = evs.filter(e=>e.text.includes('هدف')).slice(-3).map(e=>`<div>${e.time} ${e.text}</div>`).join('');
  document.getElementById('endStats').innerHTML = `
    <div class="stat-item">⚽ تسديداتك<strong>${s.homeShoots}</strong></div>
    <div class="stat-item">🎯 تسديدات الخصم<strong>${s.awayShoots||0}</strong></div>
    <div class="stat-item">📊 الاستحواذ<strong>${s.homePoss}%</strong></div>
    <div class="stat-item">🏠 أهداف فريقك<strong>${h}</strong></div>
    <div class="stat-item">🔵 أهداف الخصم<strong>${a}</strong></div>
    <div class="stat-item">🧤 تصديات<strong>${(game&&game.gkHome)?game.gkHome.saves||0:0}</strong></div>
  `;
  showScreen('endScreen');
}

function restartGame() { startGame(difficulty); }
function showMenu() { if (game) { game.running=false; game.removeInput&&game.removeInput(); } showScreen('mainMenu'); }
function showControls() { showScreen('controlsScreen'); }
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
