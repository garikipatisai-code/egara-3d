/** Minimal synth SFX: no assets, unlocked on first gesture. */
export class AudioController {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted: boolean;
  private readonly onMute?: (muted: boolean) => void;

  constructor(options: { muted?: boolean; onMute?: (muted: boolean) => void } = {}) {
    this.muted = options.muted ?? false;
    this.onMute = options.onMute;
  }

  unlock(): void {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const Ctor = globalThis.AudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.3;
    this.master.connect(this.context.destination);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setValueAtTime(this.muted ? 0 : 0.3, this.context.currentTime);
    }
    this.onMute?.(this.muted);
    return this.muted;
  }

  play(name: 'sting' | 'hit' | 'win' | 'lose'): void {
    if (!this.context || !this.master || this.muted) return;
    const t = this.context.currentTime;
    const notes: Record<string, [number, number][]> = {
      sting: [[880, 0.07]],
      hit: [[220, 0.12]],
      win: [[523, 0.12], [659, 0.12], [784, 0.25]],
      lose: [[392, 0.15], [311, 0.15], [262, 0.3]]
    };
    notes[name].forEach(([freq, dur], i) => {
      if (!this.context || !this.master) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const start = t + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.5, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }
}
