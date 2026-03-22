
// ===== AI ENGINE =====
class AIEngine {
  constructor(difficulty) {
    this.difficulty = difficulty; // easy | medium | hard
    this.reaction = difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.25 : 0.08;
    this.timer = 0;
    this.strategy = 'defense';
  }

  update(dt, players, ball, homeScore, awayScore) {
    this.timer += dt;
    if (this.timer < this.reaction) return;
    this.timer = 0;

    const awayPlayers = players.filter(p => p.team === 'away');
    const ballDist = awayPlayers.map(p => ({ p, d: Math.hypot(p.x - ball.x, p.y - ball.y) }));
    ballDist.sort((a, b) => a.d - b.d);
    const chaser = ballDist[0]?.p;

    // Strategy switch
    if (awayScore < homeScore) this.strategy = 'attack';
    else if (awayScore > homeScore + 1) this.strategy = 'defense';
    else this.strategy = Math.random() > 0.5 ? 'attack' : 'defense';

    awayPlayers.forEach((p, i) => {
      if (i === 0 && chaser === p) {
        // Chase ball
        this.moveTowards(p, ball.x, ball.y, dt, p.speed);
        if (Math.hypot(p.x - ball.x, p.y - ball.y) < 0.06) {
          const goalX = 0.01, goalY = 0.5;
          const shoot_chance = this.difficulty === 'hard' ? 0.7 : this.difficulty === 'medium' ? 0.5 : 0.3;
          if (p.x < 0.35 && Math.random() < shoot_chance) {
            p.shoot(ball, goalX, goalY + (Math.random() - 0.5) * 0.2);
          } else {
            const nearest = this.findNearestTeammate(p, awayPlayers);
            if (nearest && Math.random() < 0.6) {
              p.pass(ball, nearest.x, nearest.y);
            } else {
              p.shoot(ball, goalX, goalY);
            }
          }
        }
      } else {
        // Formation positioning
        const rx = this.strategy === 'attack' ? 0.55 - i * 0.12 : 0.75 - i * 0.1;
        const ry = 0.15 + (i % 4) * 0.22;
        this.moveTowards(p, rx, ry, dt, p.speed * 0.6);
      }
    });
  }

  moveTowards(p, tx, ty, dt, spd) {
    const dx = tx - p.x, dy = ty - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > 0.01) {
      p.x += (dx / dist) * spd * dt;
      p.y += (dy / dist) * spd * dt;
      p.angle = Math.atan2(dy, dx);
    }
  }

  findNearestTeammate(p, team) {
    let best = null, bestD = Infinity;
    team.forEach(t => {
      if (t === p) return;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bestD) { bestD = d; best = t; }
    });
    return best;
  }
}
