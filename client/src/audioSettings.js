const listeners = new Set();
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
