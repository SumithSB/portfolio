// Ambient sound, made in the browser so there are no audio files to load.
// Off until the visitor turns it on. Birds at dawn, traffic in the city, rain in the UK, a low hum at night.
export function createAmbience() {
  let ctx: AudioContext | null = null;
  let master: GainNode, birds: GainNode, traffic: GainNode, rain: GainNode, hum: GainNode;
  let on = false, chirpTimer = 0;

  const noise = (c: AudioContext, brown: boolean) => {
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s;
  };

  const build = () => {
    const c = new AudioContext(); ctx = c;
    master = c.createGain(); master.gain.value = 0; master.connect(c.destination);
    const bus = (g: number) => { const n = c.createGain(); n.gain.value = g; n.connect(master); return n; };
    birds = bus(0); traffic = bus(0); rain = bus(0); hum = bus(0);

    const tf = c.createBiquadFilter(); tf.type = 'lowpass'; tf.frequency.value = 380; noise(c, true).connect(tf); tf.connect(traffic);
    const rf = c.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 1400; const rg = c.createGain(); rg.gain.value = 0.25; noise(c, false).connect(rf); rf.connect(rg); rg.connect(rain);
    const o = c.createOscillator(); o.frequency.value = 55; const of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 120; o.connect(of); of.connect(hum); o.start();
  };

  const chirp = () => {
    if (!ctx || !on) return;
    const c = ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    const f = 2600 + Math.random() * 1800;
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.6), t + 0.12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(birds); o.start(t); o.stop(t + 0.2);
    chirpTimer = window.setTimeout(chirp, 300 + Math.random() * 1600);
  };

  const ramp = (n: GainNode, v: number) => { if (ctx) n.gain.setTargetAtTime(v, ctx.currentTime, 0.4); };

  return {
    start() { if (!ctx) build(); on = true; ctx!.resume(); ramp(master, 0.6); clearTimeout(chirpTimer); chirp(); },
    stop() { on = false; clearTimeout(chirpTimer); if (ctx) ramp(master, 0); },
    // f: position through the day, 0 (dawn) to 5 (night); -1 when the walk is off screen.
    setMix(f: number) {
      if (!ctx || !on) return;
      if (f < 0) { ramp(master, 0); return; }
      ramp(master, 0.6);
      const near = (c: number, w = 1) => Math.max(0, 1 - Math.abs(f - c) / w);
      ramp(birds, Math.max(near(0, 1.4), near(1, 0.8) * 0.5));
      ramp(traffic, Math.max(near(2, 1.2), near(3, 1.2)) * 0.5 + near(5, 0.8) * 0.2);
      ramp(rain, near(4, 0.9) * 0.6);
      ramp(hum, Math.max(near(5, 1.2), near(1, 0.8) * 0.3) * 0.25);
    },
  };
}
