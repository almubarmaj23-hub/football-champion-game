
// ===== BALL PHYSICS =====
class Ball {
  constructor() { this.reset(); }

  reset() {
    this.x = 0.5; this.y = 0.5;
    this.vx = 0; this.vy = 0;
    this.rotation = 0;
    this.lastTouched = null;
  }

  update(dt) {
    const friction = 0.985;
    this.vx *= friction; this.vy *= friction;
    if (Math.abs(this.vx) < 0.0001) this.vx = 0;
    if (Math.abs(this.vy) < 0.0001) this.vy = 0;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    this.rotation += speed * dt * 8;
    // Bounce from top/bottom
    if (this.y < 0.03) { this.y = 0.03; this.vy *= -0.7; }
    if (this.y > 0.97) { this.y = 0.97; this.vy *= -0.7; }
  }

  kick(dvx, dvy) {
    this.vx = dvx; this.vy = dvy;
  }
}
