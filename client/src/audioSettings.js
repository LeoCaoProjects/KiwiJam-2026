const listeners = new Set();

const audioSettings = {
  volume: (() => {
    const saved = localStorage.getItem("volume");
    return saved !== null ? parseFloat(saved) : 0.6;
  })(),
  vfxEnabled: (() => {
    const saved = localStorage.getItem("vfxEnabled");
    return saved !== null ? saved === "true" : true;
  })(),
};

export function getVolume() {
  return audioSettings.volume;
}

export function setVolume(value) {
  audioSettings.volume = value;
  localStorage.setItem("volume", value);
  listeners.forEach((fn) => fn(audioSettings));
}

export function getVfxEnabled() {
  return audioSettings.vfxEnabled;
}

export function setVfxEnabled(value) {
  audioSettings.vfxEnabled = value;
  localStorage.setItem("vfxEnabled", value);
  listeners.forEach((fn) => fn(audioSettings));
}

export function subscribeAudioSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function playSound(path, baseVolume = 0.5) {
  if (!audioSettings.vfxEnabled) return;
  const sfx = new Audio(path);
  sfx.volume = Math.min(1, Math.max(0, baseVolume * audioSettings.volume));
  sfx.play();
}