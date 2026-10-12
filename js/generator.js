// Random WOD generator.

import { EXERCISES } from './exercises.js';
import { DEFAULT_TIMER } from './timer.js';

export const FOCUSES = [
  { id: 'full', label: 'Full body', muscles: null },
  { id: 'upper', label: 'Upper', muscles: ['shoulders', 'chest', 'back', 'upper back', 'biceps', 'triceps', 'forearms'] },
  { id: 'lower', label: 'Lower', muscles: ['quads', 'glutes', 'hamstrings', 'power', 'balance'] },
  { id: 'core', label: 'Core', muscles: ['core', 'abs', 'lower abs', 'obliques', 'hip flexors'] },
];

export const EQUIPMENT = [
  { id: 'mixed', label: 'Mixed', categories: ['kettlebell', 'bodyweight', 'combo'] },
  { id: 'kettlebell', label: 'Kettlebell', categories: ['kettlebell', 'combo'] },
  { id: 'bodyweight', label: 'Bodyweight', categories: ['bodyweight'] },
];

// Movements that are normally held for time rather than counted.
const TIMED = new Set(['plank', 'hollow-hold']);

function musclesOf(ex, all) {
  if (!ex.parts) return ex.muscles || [];
  return ex.parts.flatMap((p) => musclesOf(all.find((e) => e.id === p.exerciseId) || {}, all));
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function repsFor(ex, type, rand) {
  const isCombo = ex.category === 'combo';
  const heavy = /snatch|clean|press|turkish|bottoms|double/i.test(ex.id);
  const ranges = {
    amrap: isCombo ? [3, 8] : heavy ? [4, 10] : [8, 20],
    fortime: isCombo ? [8, 15] : heavy ? [10, 20] : [20, 50],
    emom: isCombo ? [3, 6] : heavy ? [4, 8] : [8, 15],
  }[type] || [8, 15];
  const [lo, hi] = ranges;
  let n = lo + Math.floor(rand() * (hi - lo + 1));
  if (type === 'fortime' && n > 20) n = Math.round(n / 5) * 5;
  return n;
}

/**
 * @param {object} opts
 * @param {string} opts.type     timer type id, or 'any'
 * @param {number} opts.minutes  approximate workout length
 * @param {string} opts.focus    FOCUSES id
 * @param {string} opts.equipment EQUIPMENT id
 * @param {object[]} [opts.extras] user combos to include in the pool
 * @param {() => number} [opts.rand]
 */
export function generateWod({ type = 'any', minutes = 15, focus = 'full', equipment = 'mixed', extras = [], rand = Math.random }) {
  const all = EXERCISES.concat(extras);
  const cats = (EQUIPMENT.find((e) => e.id === equipment) || EQUIPMENT[0]).categories;
  const want = (FOCUSES.find((f) => f.id === focus) || FOCUSES[0]).muscles;

  let pool = all.filter((e) => cats.includes(e.category));
  if (want) {
    const focused = pool.filter((e) => musclesOf(e, all).some((m) => want.includes(m)));
    if (focused.length >= 3) pool = focused;
  }

  if (type === 'any') type = pick(['amrap', 'emom', 'fortime', 'intervals', 'tabata'], rand);
  minutes = Math.max(4, Math.round(minutes));

  let timer;
  let count;
  switch (type) {
    case 'amrap':
      timer = { type, minutes };
      count = 3 + Math.floor(rand() * 3);
      break;
    case 'emom': {
      count = 2 + Math.floor(rand() * 3);
      // Make the number of rounds a multiple of the movement count.
      const rounds = Math.max(count, Math.round(minutes / count) * count);
      timer = { type, interval: 60, rounds };
      break;
    }
    case 'fortime': {
      count = 3 + Math.floor(rand() * 3);
      const rounds = minutes >= 15 ? pick([1, 3, 5], rand) : pick([1, 3], rand);
      timer = { type, cap: Math.round(minutes * 1.5), rounds };
      break;
    }
    case 'intervals': {
      const work = pick([30, 40, 45], rand);
      const rest = 60 - work;
      count = 3 + Math.floor(rand() * 3);
      timer = { type, work, rest, rounds: Math.max(count, Math.round(minutes / count) * count) };
      break;
    }
    case 'tabata':
    default:
      type = 'tabata';
      timer = { ...DEFAULT_TIMER.tabata };
      count = pick([1, 2, 4], rand);
      break;
  }

  const chosen = shuffle(pool, rand).slice(0, Math.min(count, pool.length));
  const repsScale = type === 'fortime' && timer.rounds > 1 ? 1 / timer.rounds ** 0.6 : 1;

  const items = chosen.map((ex) => {
    if (type === 'intervals' || type === 'tabata') {
      return { exerciseId: ex.id, reps: timer.work, unit: 'sec' };
    }
    if (TIMED.has(ex.id)) {
      return { exerciseId: ex.id, reps: type === 'emom' ? 40 : 30, unit: 'sec' };
    }
    const reps = Math.max(1, Math.round(repsFor(ex, type, rand) * repsScale));
    return { exerciseId: ex.id, reps, unit: ex.unilateral ? 'side' : 'reps' };
  });

  const focusLabel = (FOCUSES.find((f) => f.id === focus) || FOCUSES[0]).label;
  return { name: `Random ${focusLabel} WOD`, timer, items };
}
