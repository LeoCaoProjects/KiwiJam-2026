const listeners = new Set();
const typewriterBuffers = new WeakMap();
let typewriterContext = null;
const savedVolume = localStorage.getItem("volume");
const oldVolume =
  savedVolume !== null ? parseFloat(savedVolume) : 0.6;

export const AUDIO_MIX = Object.freeze({
  menuMusic: 0.18,
  gameplayMusic: 0.16,
  creepyMusic: 0.24,
  creditsMusic: 0.28,
  uiClick: 0.65,
  playerJoin: 0.85,
  jump: 1,
  fall: 0.42,
  placeBlock: 0.9,
  blockCountdown: 0.85,
  typing: 0.28,
});

const audioSettings = {
  musicVolume: (() => {
    const saved = localStorage.getItem("musicVolume");
    return saved !== null ? parseFloat(saved) : oldVolume;
  })(),
  sfxVolume: (() => {
    const saved = localStorage.getItem("sfxVolume");
    return saved !== null ? parseFloat(saved) : oldVolume;
  })(),
};

export function getMusicVolume() {
  return audioSettings.musicVolume;
}

export function setMusicVolume(value) {
  audioSettings.musicVolume = value;
  localStorage.setItem("musicVolume", value);
  listeners.forEach((fn) => fn(audioSettings));
}

export function getSfxVolume() {
  return audioSettings.sfxVolume;
}

export function setSfxVolume(value) {
  audioSettings.sfxVolume = value;
  localStorage.setItem("sfxVolume", value);
  listeners.forEach((fn) => fn(audioSettings));
}

export function subscribeAudioSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getMixedVolume(soundName) {
  const mixVolume = AUDIO_MIX[soundName] ?? 0.7;
  const settingsVolume = soundName.endsWith("Music")
    ? audioSettings.musicVolume
    : audioSettings.sfxVolume;

  return Math.min(
    1,
    Math.max(0, mixVolume * settingsVolume)
  );
}

export function playSound(path, soundName = "uiClick") {
  const sfx = new Audio(path);

  sfx.volume = getMixedVolume(soundName);
  sfx.play().catch(() => {});
}

export function playTypewriterSound(character, context) {
  let audioContext = context;

  if (!audioContext) {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    if (!typewriterContext) {
      typewriterContext = new AudioContext();
    }

    audioContext = typewriterContext;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
    return;
  }

  if (audioContext.state !== "running") {
    return;
  }

  if (!typewriterBuffers.has(audioContext)) {
    const length = Math.floor(audioContext.sampleRate * 0.025);
    const buffer = audioContext.createBuffer(
      1,
      length,
      audioContext.sampleRate
    );
    const samples = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      const fade = 1 - index / length;
      samples[index] =
        (Math.random() * 2 - 1) * fade * fade;
    }

    typewriterBuffers.set(audioContext, buffer);
  }

  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  source.buffer = typewriterBuffers.get(audioContext);
  source.playbackRate.value =
    0.92 + (character.charCodeAt(0) % 7) * 0.02;
  filter.type = "bandpass";
  filter.frequency.value = 1500;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(
    getMixedVolume("typing"),
    now
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.025
  );

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start(now);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}
