// Retro Audio Synthesizer using Web Audio API

let audioCtx: AudioContext | null = null;
let musicInterval: any = null;
let musicNodes: AudioNode[] = [];

let isSoundEnabled = true;
let isMusicEnabled = true;

// Initialize audio context lazily after user interaction
export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
  localStorage.setItem('panda_sound_enabled', JSON.stringify(enabled));
}

export function setMusicEnabled(enabled: boolean) {
  isMusicEnabled = enabled;
  localStorage.setItem('panda_music_enabled', JSON.stringify(enabled));
  if (!enabled) {
    stopMusic();
  } else {
    startMusic();
  }
}

export function loadAudioSettings() {
  const sound = localStorage.getItem('panda_sound_enabled');
  const music = localStorage.getItem('panda_music_enabled');
  if (sound !== null) isSoundEnabled = JSON.parse(sound);
  if (music !== null) isMusicEnabled = JSON.parse(music);
  return { soundEnabled: isSoundEnabled, musicEnabled: isMusicEnabled };
}

// Synthesize a retro Flap/Jump Sound
export function playFlap() {
  if (!isSoundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle'; // softer than saw/square
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  // Sweet upward sweep
  osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.13);
}

// Synthesize a beautiful dual-tone retro Coin Sound
export function playCoin() {
  if (!isSoundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Sound consists of 2 quick notes: B5 (987.77 Hz) then E6 (1318.51 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(988, now);
  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.09);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1319, now + 0.08);
  gain2.gain.setValueAtTime(0.12, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.29);
}

// Synthesize a standard Retro Click Pop
export function playClick() {
  if (!isSoundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.06);
}

// Synthesize a skin unlock arpeggio sound (happy rising sequence)
export function playUnlock() {
  if (!isSoundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.1, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.21);
  });
}

// Synthesize a tragic downward sweep minor chord (Game Over)
export function playGameOver() {
  if (!isSoundEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Let's create a slow downward sweeping sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.4);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

  // Filter out high frequencies to make it sound "muffled" and retro-heavy
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, now);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.41);
}

// Play a cute, 8-bit rhythmic procedural music loop
export function startMusic() {
  if (!isMusicEnabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  if (musicInterval) return; // already playing

  // Simple happy retro sequence in C Major / Pentatonic:
  // C4, E4, G4, A4, G4, E4, C4, D4...
  const melody = [
    261.63, 329.63, 392.00, 440.00,
    392.00, 329.63, 261.63, 293.66,
    329.63, 392.00, 440.00, 523.25,
    440.00, 392.00, 329.63, 293.66
  ];

  let step = 0;
  const stepDuration = 0.25; // 250ms per beat (120 BPM)

  const playStep = () => {
    if (!isMusicEnabled || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // gentle background sine tone
    osc.frequency.value = melody[step % melody.length];

    // Give it a slightly staccato pluck envelope
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.04, now); // low volume so it's not annoying
    gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration - 0.02);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + stepDuration);

    // Keep references to clean up if we stop
    musicNodes.push(osc);
    if (musicNodes.length > 10) {
      musicNodes.shift();
    }

    // Play a very subtle sub bass note every 4 beats
    if (step % 4 === 0) {
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.type = 'triangle';
      // Bass notes: C2 (65.41Hz), F2 (87.31Hz), G2 (98Hz), C2
      const bassNotes = [65.41, 65.41, 87.31, 98.00];
      bassOsc.frequency.value = bassNotes[Math.floor(step / 4) % bassNotes.length];

      bassGain.gain.setValueAtTime(0.05, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 3.8);

      bassOsc.connect(bassGain);
      bassGain.connect(audioCtx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + stepDuration * 3.9);

      musicNodes.push(bassOsc);
    }

    step++;
  };

  // Run the sequence loop
  musicInterval = setInterval(playStep, stepDuration * 1000);
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  // Immediately stop all currently scheduled nodes if possible
  musicNodes.forEach((node) => {
    try {
      (node as any).stop();
    } catch (e) {
      // already stopped or not started
    }
  });
  musicNodes = [];
}
