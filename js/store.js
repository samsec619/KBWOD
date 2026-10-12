// Persistence in localStorage. Everything stays on the device.

const PREFIX = 'kbwod.';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (e.g. private mode) — keep working in memory.
  }
}

export const DEFAULT_SETTINGS = {
  prepSeconds: 10,
  sound: true,
  voice: true,
  unit: 'kg',
};

export const store = {
  getWods: () => read('wods', []),
  saveWods: (wods) => write('wods', wods),
  getCombos: () => read('combos', []),
  saveCombos: (combos) => write('combos', combos),
  getLog: () => read('log', []),
  saveLog: (log) => write('log', log),
  getSettings: () => ({ ...DEFAULT_SETTINGS, ...read('settings', {}) }),
  saveSettings: (s) => write('settings', s),

  exportAll() {
    return {
      app: 'kbwod',
      version: 1,
      exportedAt: new Date().toISOString(),
      wods: this.getWods(),
      combos: this.getCombos(),
      log: this.getLog(),
      settings: this.getSettings(),
    };
  },

  importAll(data) {
    if (!data || data.app !== 'kbwod') throw new Error('Not a KB WOD backup file');
    if (Array.isArray(data.wods)) this.saveWods(data.wods);
    if (Array.isArray(data.combos)) this.saveCombos(data.combos);
    if (Array.isArray(data.log)) this.saveLog(data.log);
    if (data.settings) this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
  },
};

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
