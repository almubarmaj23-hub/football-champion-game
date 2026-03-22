
// ===== GOALKEEPER - حارس المرمى =====
class Goalkeeper extends Player {
  constructor(team, x, y) {
    super(team, 1, x, y);
    this.homeX = x; this.homeY = y;
    this.speed = 0.22;
    this.diveTimer = 0;
    this.diving = false;
    this.diveDir = 0;
    this.saves = 0;
    this.isGK = true;
  }

  updateGK(dt, ball, fieldRect) {
    this.diveTimer = Math.max(0, this.diveTimer - dt);
    if (this.diveTimer > 0) return;
    this.diving = false;

    const isHome = this.team === 'home';
    const goalLineX = isHome ? 0.06 : 0.94;
    const ballComingToGoal = isHome
      ? (ball.vx < -0.05 && ball.x < 0.35)
      : (ball.vx >  0.05 && ball.x > 0.65);

    // Stay on goal line, track ball Y
    const targetX = goalLineX + (ballComingToGoal ? (isHome ? -0.03 : 0.03) : 0);
    const targetY = Math.max(0.35, Math.min(0.65, ball.y));

    const dx = targetX - this.x, dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = this.speed * (ballComingToGoal ? 1.5 : 0.8);
    if (dist > 0.01) {
      this.x += (dx / dist) * spd * dt;
      this.y += (dy / dist) * spd * dt;
      this.angle = Math.atan2(dy, dx);
    }

    // Dive to block ball
    const ballDist = Math.hypot(ball.x - this.x, ball.y - this.y);
    if (ballComingToGoal && ballDist < 0.12) {
      this.dive(ball, dt);
    }
  }

  dive(ball, dt) {
    if (this.diveTimer > 0) return;
    const ballDist = Math.hypot(ball.x - this.x, ball.y - this.y);
    if (ballDist < 0.08) {
      // Save the ball!
      const isHome = this.team === 'home';
      ball.vx = isHome ? Math.abs(ball.vx) * 0.8 : -Math.abs(ball.vx) * 0.8;
      ball.vy = (Math.random() - 0.5) * 0.4;
      ball.lastTouched = this;
      this.diveTimer = 1.2;
      this.diving = true;
      this.saves++;
    }
  }
}
