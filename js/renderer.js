
// ===== RENDERER - رسم الملعب والكرة =====
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const hud = document.getElementById('hud');
    const mobile = document.getElementById('mobileControls');
    const hudH = hud ? hud.offsetHeight : 60;
    const mobileH = (mobile && getComputedStyle(mobile).display !== 'none') ? 100 : 0;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - hudH - mobileH;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  get W() { return this.canvas.width; }
  get H() { return this.canvas.height; }
  set W(v) {}
  set H(v) {}

  get fieldRect() {
    const pad = Math.min(this.canvas.width, this.canvas.height) * 0.05;
    return {
      x: pad, y: pad,
      w: this.canvas.width - pad * 2,
      h: this.canvas.height - pad * 2
    };
  }

  drawField() {
    const ctx = this.ctx;
    const { x, y, w, h } = this.fieldRect;
    const cx = x + w / 2, cy = y + h / 2;

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Field stripes
    const stripeCount = 10;
    const sw = w / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2d5a1b' : '#265218';
      ctx.fillRect(x + i * sw, y, sw, h);
    }

    // Field border
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Center line
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y + h);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty areas
    const pa_w = w * 0.12, pa_h = h * 0.44;
    // Left
    ctx.strokeRect(x, cy - pa_h / 2, pa_w, pa_h);
    // Right
    ctx.strokeRect(x + w - pa_w, cy - pa_h / 2, pa_w, pa_h);

    // Goal areas
    const ga_w = w * 0.05, ga_h = h * 0.22;
    ctx.strokeRect(x, cy - ga_h / 2, ga_w, ga_h);
    ctx.strokeRect(x + w - ga_w, cy - ga_h / 2, ga_w, ga_h);

    // Goals
    const gw = 10, gh = h * 0.18;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x - gw, cy - gh / 2, gw, gh);
    ctx.fillRect(x + w, cy - gh / 2, gw, gh);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - gw, cy - gh / 2, gw, gh);
    ctx.strokeRect(x + w, cy - gh / 2, gw, gh);

    // Corner arcs
    const ca = h * 0.03;
    ctx.lineWidth = 2;
    [[x, y, 0, Math.PI / 2], [x + w, y, Math.PI / 2, Math.PI],
     [x + w, y + h, Math.PI, 3 * Math.PI / 2], [x, y + h, 3 * Math.PI / 2, Math.PI * 2]
    ].forEach(([px, py, a1, a2]) => {
      ctx.beginPath(); ctx.arc(px, py, ca, a1, a2); ctx.stroke();
    });
  }

  drawBall(ball) {
    const ctx = this.ctx;
    const { fx, fy } = this.toField(ball.x, ball.y);
    const r = Math.max(7, Math.min(14, 10));

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(fx + 2, fy + 3, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball gradient
    const grad = ctx.createRadialGradient(fx - r * 0.3, fy - r * 0.3, r * 0.1, fx, fy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#dddddd');
    grad.addColorStop(1, '#888888');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();

    // Pentagons pattern
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#333';
    const angle = ball.rotation || 0;
    for (let i = 0; i < 5; i++) {
      const a = angle + (i * Math.PI * 2) / 5;
      const px = fx + Math.cos(a) * r * 0.45;
      const py = fy + Math.sin(a) * r * 0.45;
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const ba = a + (j * Math.PI * 2) / 5;
        const bx = px + Math.cos(ba) * r * 0.28;
        const by = py + Math.sin(ba) * r * 0.28;
        j === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.closePath(); ctx.fill();
    }
  }

  drawPlayer(p) {
    const ctx = this.ctx;
    const { fx, fy } = this.toField(p.x, p.y);
    const r = 16;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(fx + 2, fy + 4, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body circle
    const isHome = p.team === 'home';
    const baseColor = isHome ? '#e63946' : '#2196F3';
    const grad = ctx.createRadialGradient(fx - 3, fy - 3, 1, fx, fy, r);
    grad.addColorStop(0, isHome ? '#ff6b7a' : '#64b5f6');
    grad.addColorStop(1, baseColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();

    // Border - highlight if controlled
    ctx.strokeStyle = p.isControlled ? '#ffea00' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth = p.isControlled ? 3 : 1.5;
    ctx.stroke();

    // Direction indicator
    const dx = Math.cos(p.angle || 0), dy = Math.sin(p.angle || 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + dx * r * 0.8, fy + dy * r * 0.8);
    ctx.stroke();

    // Number
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${r * 0.7}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.number || '?', fx, fy + 1);

    // Stamina bar
    if (p.stamina !== undefined) {
      const bw = r * 2.2, bh = 3;
      const bx = fx - bw / 2, by = fy + r + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, bh);
      const stColor = p.stamina > 60 ? '#00e676' : p.stamina > 30 ? '#ffea00' : '#ff1744';
      ctx.fillStyle = stColor;
      ctx.fillRect(bx, by, bw * (p.stamina / 100), bh);
    }
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  toField(nx, ny) {
    const { x, y, w, h } = this.fieldRect;
    return { fx: x + nx * w, fy: y + ny * h };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
