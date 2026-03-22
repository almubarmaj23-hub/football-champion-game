
// ===== REFEREE - الحكم والبطاقات =====
class Referee {
  constructor() {
    this.cards = { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } };
    this.freekick = null;
    this.freekickTimer = 0;
    this.events = [];
    this.cooldown = 0;
  }

  update(dt, players, ball) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.freekickTimer > 0) {
      this.freekickTimer -= dt;
      if (this.freekickTimer <= 0) this.freekick = null;
    }

    if (this.cooldown > 0 || this.freekick) return;

    // Check dangerous tackles
    players.forEach(p => {
      if (p.tackle_cd > 0.5) {
        const nearEnemy = players.find(e =>
          e.team !== p.team && Math.hypot(e.x - p.x, e.y - p.y) < 0.05
        );
        if (nearEnemy && Math.random() < 0.15) {
          this.callFoul(p, ball);
        }
      }
    });
  }

  callFoul(player, ball) {
    this.cooldown = 4;
    const chance = Math.random();
    let card = null;

    if (chance < 0.2) {
      card = 'yellow';
      this.cards[player.team].yellow++;
      if (this.cards[player.team].yellow >= 2) {
        card = 'red';
        this.cards[player.team].red++;
      }
    }

    const fk = { x: ball.x, y: ball.y, team: player.team === 'home' ? 'away' : 'home' };
    this.freekick = fk;
    this.freekickTimer = 3;
    ball.vx = 0; ball.vy = 0;
    ball.x = fk.x; ball.y = fk.y;

    this.events.push({
      type: card ? `🟨 بطاقة صفراء` : '⚠️ خطأ',
      team: player.team,
      time: Date.now(),
      card
    });

    // Show card notification
    this.showFoulUI(card, player.team);
  }

  showFoulUI(card, team) {
    const el = document.getElementById('foulNotif');
    if (!el) return;
    el.textContent = card === 'yellow' ? '🟨 بطاقة صفراء!' : card === 'red' ? '🟥 بطاقة حمراء!' : '⚠️ خطأ!';
    el.style.color = card === 'red' ? '#ff1744' : card === 'yellow' ? '#ffea00' : '#fff';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2000);
  }

  getCardBadge(team) {
    const c = this.cards[team];
    return `🟨${c.yellow} 🟥${c.red}`;
  }
}
