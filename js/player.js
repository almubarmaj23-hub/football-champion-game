
// ===== PLAYER CLASS =====
class Player {
  constructor(team, number, x, y) {
    this.team = team;
    this.number = number;
    this.x = x; this.y = y;
    this.homeX = x; this.homeY = y;
    this.vx = 0; this.vy = 0;
    this.angle = team === 'home' ? 0 : Math.PI;
    this.speed = 0.25 + Math.random() * 0.05;
    this.stamina = 100;
    this.isControlled = false;
    this.hasBall = false;
    this.tackle_cd = 0;
  }

  update(dt, input, ball) {
    let targetVx = 0, targetVy = 0;
    let spd = this.speed;
    if (this.isControlled) {
      if (input.up)    targetVy = -spd;
      if (input.down)  targetVy =  spd;
      if (input.left)  targetVx = -spd;
      if (input.right) targetVx =  spd;
      if (input.sprint) { targetVx *= 1.6; targetVy *= 1.6; this.stamina = Math.max(0, this.stamina - 20 * dt); }
      if (targetVx !== 0 || targetVy !== 0) {
        this.angle = Math.atan2(targetVy, targetVx);
      }
    }
    const acc = 15;
    this.vx += (targetVx - this.vx) * acc * dt;
    this.vy += (targetVy - this.vy) * acc * dt;
    this.x = Math.max(0.01, Math.min(0.99, this.x + this.vx * dt));
    this.y = Math.max(0.02, Math.min(0.98, this.y + this.vy * dt));
    if (!input.sprint) this.stamina = Math.min(100, this.stamina + 5 * dt);
    if (this.tackle_cd > 0) this.tackle_cd -= dt;

    // Dribble with ball
    const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
    if (dist < 0.04 && ball.lastTouched !== this) {
      ball.lastTouched = this;
    }
    this.hasBall = ball.lastTouched === this && dist < 0.05;
  }

  shoot(ball, targetX, targetY) {
    const dx = targetX - this.x, dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const power = 0.7 + Math.random() * 0.3;
    ball.x = this.x; ball.y = this.y;
    ball.kick((dx / dist) * power * 1.5, (dy / dist) * power * 1.5);
    ball.lastTouched = this;
  }

  pass(ball, targetX, targetY) {
    const dx = targetX - this.x, dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    ball.x = this.x; ball.y = this.y;
    ball.kick((dx / dist) * 0.55, (dy / dist) * 0.55);
    ball.lastTouched = this;
  }
}
