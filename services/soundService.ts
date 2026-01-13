
class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Minimalist "Glass Tap" for buttons
  playClick(volume: number) {
    this.init();
    if (!this.ctx || volume <= 0) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // High-pitched, extremely short sine wave for a clean "pip"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
    
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.03);
    
    // Very subtle haptic
    if (navigator.vibrate) navigator.vibrate(2);
  }

  // Generic tick sound (Alias for click)
  playTick(volume: number) {
    this.playClick(volume);
  }

  // Micro-tick for wheels
  playWheelTick(volume: number) {
    this.init();
    if (!this.ctx || volume <= 0) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    
    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.01);
  }

  // Sub-frequency "Friction" for sliders
  playSliderTick(volume: number) {
    this.init();
    if (!this.ctx || volume <= 0) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.02);
  }

  // Soft glass harmonic success chime
  playPing(volume: number) {
    this.init();
    if (!this.ctx || volume <= 0) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(900, now);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now + 0.05);

    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc1.start();
    osc2.start(now + 0.05);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
    if (navigator.vibrate) navigator.vibrate([2, 30, 2]);
  }

  // Clean ambient neural pulse
  playNeural(volume: number) {
    this.init();
    if (!this.ctx || volume <= 0) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.4);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.6);
  }
}

export const soundEngine = new SoundEngine();
