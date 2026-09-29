class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  init() {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.45;
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get context() {
    return this.ctx;
  }
  get output() {
    return this.master;
  }
  get isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }
}

export const audio = new AudioManager();

function tone(
  freq: number,
  type: OscillatorType,
  dur: number,
  vol: number,
  at = 0,
  slideTo?: number,
) {
  const ctx = audio.context;
  const out = audio.output;
  if (!ctx || !out) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, cutoff: number) {
  const ctx = audio.context;
  const out = audio.output;
  if (!ctx || !out) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  src.start();
  src.stop(ctx.currentTime + dur + 0.02);
}

export const sfx = {
  jump: () => tone(220, "square", 0.16, 0.16, 0, 620),
  land: () => noise(0.09, 0.12, 500),
  coin: () => {
    tone(880, "square", 0.08, 0.1);
    tone(1320, "square", 0.09, 0.08, 0.05);
  },
  brand: () => {
    noise(0.22, 0.28, 1400);
    [523, 659, 784, 1046].forEach((f, i) => tone(f, "triangle", 0.18, 0.12, i * 0.05));
  },
  gem: () => [659, 880, 1174, 1568].forEach((f, i) => tone(f, "sine", 0.26, 0.14, i * 0.06)),
  crash: () => {
    noise(0.3, 0.35, 700);
    tone(120, "sawtooth", 0.3, 0.2, 0, 50);
  },
  boost: () => tone(180, "sawtooth", 0.5, 0.12, 0, 900),
  finale: () =>
    [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, "triangle", 0.5, 0.14, i * 0.12)),
  start: () => [523, 784].forEach((f, i) => tone(f, "triangle", 0.2, 0.12, i * 0.09)),
};
