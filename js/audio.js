
// ===== WEB AUDIO ENGINE =====
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { this.enabled = false; }
  }

  playTone(freq, type, duration, vol = 0.3) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
  }

  kick() { this.playTone(80, 'sine', 0.15, 0.5); }
  whistle() {
    [880, 1100, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.2, 0.4), i * 200);
    });
  }
  goal() {
    [440, 550, 660, 880, 1100].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.3, 0.6), i * 100);
    });
  }
  tackle() { this.playTone(200, 'sawtooth', 0.1, 0.4); }
}
