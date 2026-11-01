export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.lastSound = new Map();
    this.ambientTimer = null;
  }

  init() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.32;
    this.master.connect(this.context.destination);
  }

  toggle() {
    this.muted = !this.muted;
    this.init();
    if (this.master && this.context) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.32, this.context.currentTime, 0.02);
    }
    return this.muted;
  }

  tone(frequency, duration, options = {}) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime + (options.delay || 0);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.15, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  noise(duration = 0.15, volume = 0.08, delay = 0) {
    if (!this.context || this.muted) return;
    const length = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter); filter.connect(gain); gain.connect(this.master);
    source.start(this.context.currentTime + delay);
  }

  play(name) {
    this.init();
    if (!this.context || this.muted) return;
    const now = performance.now();
    const throttle = ['shot', 'impact', 'melee', 'spawn', 'spell-impact'].includes(name) ? 60 : 0;
    if (now - (this.lastSound.get(name) || 0) < throttle) return;
    this.lastSound.set(name, now);
    switch (name) {
      case 'click':
        this.tone(520, 0.055, { type: 'sine', volume: 0.07, endFrequency: 650 });
        break;
      case 'select':
        this.tone(420, 0.08, { type: 'triangle', volume: 0.08, endFrequency: 620 });
        break;
      case 'error':
        this.tone(155, 0.13, { type: 'square', volume: 0.05, endFrequency: 115 });
        break;
      case 'deploy':
        this.tone(190, 0.18, { type: 'triangle', volume: 0.1, endFrequency: 430 });
        this.tone(510, 0.13, { type: 'sine', volume: 0.07, delay: 0.07 });
        break;
      case 'spell':
        this.tone(650, 0.5, { type: 'sine', volume: 0.08, endFrequency: 110 });
        break;
      case 'comet':
        this.noise(0.45, 0.2);
        this.tone(95, 0.42, { type: 'sawtooth', volume: 0.15, endFrequency: 38 });
        break;
      case 'pulse':
        this.tone(160, 0.32, { type: 'sine', volume: 0.18, endFrequency: 620 });
        break;
      case 'shot':
        this.tone(680, 0.07, { type: 'square', volume: 0.025, endFrequency: 310 });
        break;
      case 'impact':
        this.noise(0.055, 0.025);
        break;
      case 'melee':
        this.noise(0.06, 0.035);
        this.tone(210, 0.055, { type: 'triangle', volume: 0.03, endFrequency: 110 });
        break;
      case 'tower':
        this.noise(0.7, 0.2);
        this.tone(110, 0.65, { type: 'sawtooth', volume: 0.16, endFrequency: 32 });
        this.tone(440, 0.35, { type: 'sine', volume: 0.07, delay: 0.08, endFrequency: 150 });
        break;
      case 'double':
        this.tone(392, 0.14, { type: 'triangle', volume: 0.09 });
        this.tone(523, 0.18, { type: 'triangle', volume: 0.09, delay: 0.12 });
        this.tone(659, 0.25, { type: 'triangle', volume: 0.09, delay: 0.24 });
        break;
      case 'victory':
        [392, 523, 659, 784].forEach((note, i) => this.tone(note, 0.4, { type: 'triangle', volume: 0.1, delay: i * 0.14 }));
        break;
      case 'defeat':
        [330, 277, 220, 165].forEach((note, i) => this.tone(note, 0.42, { type: 'triangle', volume: 0.09, delay: i * 0.16 }));
        break;
      case 'full':
        this.tone(760, 0.12, { type: 'sine', volume: 0.045, endFrequency: 980 });
        break;
      case 'spell-impact':
        this.noise(0.26, 0.12);
        this.tone(180, 0.24, { type: 'sawtooth', volume: 0.1, endFrequency: 55 });
        break;
      case 'lightning':
        this.noise(0.3, 0.16);
        this.tone(1600, 0.16, { type: 'square', volume: 0.055, endFrequency: 230 });
        this.tone(760, 0.3, { type: 'sawtooth', volume: 0.06, delay: 0.04, endFrequency: 80 });
        break;
      case 'rocket':
        this.tone(220, 0.5, { type: 'sawtooth', volume: 0.06, endFrequency: 80 });
        this.noise(0.62, 0.19, 0.18);
        this.tone(85, 0.5, { type: 'sawtooth', volume: 0.14, delay: 0.18, endFrequency: 32 });
        break;
      case 'freeze':
        this.tone(880, 0.5, { type: 'sine', volume: 0.06, endFrequency: 1320 });
        this.tone(1320, 0.42, { type: 'triangle', volume: 0.045, delay: 0.08, endFrequency: 660 });
        break;
      case 'rage':
        this.tone(140, 0.42, { type: 'sawtooth', volume: 0.08, endFrequency: 280 });
        this.tone(210, 0.32, { type: 'triangle', volume: 0.05, delay: 0.12, endFrequency: 420 });
        break;
      case 'jump':
        this.tone(240, 0.18, { type: 'sine', volume: 0.045, endFrequency: 540 });
        this.noise(0.1, 0.035, 0.08);
        break;
      case 'spawn':
        this.tone(320, 0.1, { type: 'triangle', volume: 0.035, endFrequency: 520 });
        break;
      case 'crown':
        this.tone(523, 0.16, { type: 'triangle', volume: 0.075 });
        this.tone(784, 0.24, { type: 'triangle', volume: 0.065, delay: 0.09 });
        break;
      case 'king':
        this.tone(196, 0.34, { type: 'sawtooth', volume: 0.055 });
        this.tone(294, 0.36, { type: 'triangle', volume: 0.06, delay: 0.08 });
        this.tone(392, 0.44, { type: 'triangle', volume: 0.055, delay: 0.17 });
        break;
    }
  }
}
