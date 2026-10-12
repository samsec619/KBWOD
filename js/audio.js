// Beeps via Web Audio and spoken cues via speech synthesis.
// iOS only allows audio after a user gesture, so call `unlock()` from a tap.

let ctx = null;

export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    // Play a silent blip so iOS fully unlocks the audio session.
    beep(0, 0.01, 0);
  } catch {
    ctx = null;
  }
  // Speech also needs to be primed by a gesture on iOS.
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  } catch {
    // ignore
  }
}

export function beep(freq = 880, duration = 0.15, volume = 0.4) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq || 1;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sounds = {
  tick: () => beep(660, 0.12, 0.35),
  go: () => beep(1046, 0.45, 0.5),
  rest: () => beep(440, 0.45, 0.45),
  finish: () => {
    beep(1046, 0.25, 0.5);
    setTimeout(() => beep(1318, 0.25, 0.5), 250);
    setTimeout(() => beep(1568, 0.6, 0.5), 500);
  },
};

export function say(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

// Keep the screen awake while a timer runs (supported on iOS 16.4+).
let wakeLock = null;

export async function keepAwake(on) {
  try {
    if (on) {
      if (!wakeLock && 'wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => (wakeLock = null));
      }
    } else if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}
