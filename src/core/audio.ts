export type SoundName = 'sting' | 'hit' | 'win' | 'lose';
export type SceneName = 'menu' | 'lane' | 'airport' | 'workshop' | 'house' | 'ritual' | 'finale';

interface Layer {
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
}

/** Minimal synth SFX + ambient layers: no assets, unlocked on first gesture. */
export class AudioController {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted: boolean;
  private readonly onMute?: (muted: boolean) => void;
  private readonly layers = new Map<string, Layer>();
  private readonly levels = new Map<string, number>();
  private scene: SceneName = 'menu';
  private tension = 0;

  constructor(options: { muted?: boolean; onMute?: (muted: boolean) => void } = {}) {
    this.muted = options.muted ?? false;
    this.onMute = options.onMute;
    this.applyScene();
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
    for (const [name, level] of this.levels) this.setLayer(name, level);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.3, this.context.currentTime, 0.05);
    }
    this.onMute?.(this.muted);
    return this.muted;
  }

  setScene(scene: SceneName): void {
    this.scene = scene;
    this.applyScene();
  }

  setTension(value: number): void {
    this.tension = Math.max(0, Math.min(1, value));
    this.setLayer('tension', this.scene === 'menu' ? 0 : this.tension * 0.08);
  }

  private applyScene(): void {
    const scene = this.scene;
    const outdoor = scene === 'lane' || scene === 'airport';
    const interior = scene === 'workshop' || scene === 'house';
    this.setLayer('buzz', scene === 'menu' ? 0.05 : 0.14);
    this.setLayer('wind', outdoor ? 0.12 : scene === 'finale' ? 0.08 : 0);
    this.setLayer('room', interior ? 0.14 : scene === 'ritual' ? 0.12 : scene === 'menu' ? 0.07 : 0);
    this.setLayer('city', outdoor || interior ? 0.075 : 0);
    this.setLayer('traffic', outdoor ? 0.055 : 0);
    this.setLayer('fire', scene === 'finale' ? 0.2 : scene === 'ritual' ? 0.07 : 0);
    this.setLayer('tension', scene === 'menu' ? 0 : this.tension * 0.08);
  }

  setLayer(name: string, level: number): void {
    this.levels.set(name, level);
    if (!this.context || !this.master) return;
    const layer = this.layers.get(name) ?? this.createLayer(name);
    if (!layer) return;
    layer.gain.gain.setTargetAtTime(this.muted ? 0 : level, this.context.currentTime, 0.12);
  }

  private createLayer(name: string): Layer | null {
    if (!this.context || !this.master) return null;
    const ctx = this.context;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master);
    const nodes: AudioScheduledSourceNode[] = [];

    if (name === 'wind' || name === 'city' || name === 'traffic' || name === 'fire') {
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      const smooth = name === 'city' ? 0.995 : name === 'traffic' ? 0.985 : 0.94;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * smooth + white * (1 - smooth);
        data[i] = name === 'fire' ? white * (Math.random() > 0.998 ? 2.4 : 0.35) : last * 3.2;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = name === 'fire' ? 'highpass' : 'lowpass';
      filter.frequency.value =
        name === 'wind' ? 620 : name === 'city' ? 380 : name === 'traffic' ? 220 : 1400;
      source.connect(filter);
      filter.connect(gain);
      source.start();
      nodes.push(source);
    } else {
      const osc = ctx.createOscillator();
      osc.type = name === 'room' ? 'sine' : name === 'tension' ? 'triangle' : 'sawtooth';
      osc.frequency.value = name === 'room' ? 55 : name === 'tension' ? 392 : 172;
      osc.connect(gain);
      osc.start();
      nodes.push(osc);
    }

    const layer = { gain, nodes };
    this.layers.set(name, layer);
    return layer;
  }

  play(name: SoundName): void {
    if (!this.context || !this.master || this.muted) return;
    const t = this.context.currentTime;
    const notes: Record<SoundName, [number, number][]> = {
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
