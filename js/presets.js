// Built-in workouts. Users can duplicate and edit them.
// Item units: 'reps' | 'side' (reps per side) | 'sec'

export const PRESET_WODS = [
  {
    id: 'preset-swing-squat-amrap',
    preset: true,
    name: 'Swing & Squat Grinder',
    timer: { type: 'amrap', minutes: 15 },
    items: [
      { exerciseId: 'combo-swing-squat', reps: 6, unit: 'reps' },
      { exerciseId: 'pushup', reps: 10, unit: 'reps' },
      { exerciseId: 'kb-gorilla-row', reps: 5, unit: 'side' },
      { exerciseId: 'reverse-lunge', reps: 6, unit: 'side' },
    ],
  },
  {
    id: 'preset-core-emom',
    preset: true,
    name: 'Core Crusher EMOM',
    timer: { type: 'emom', interval: 60, rounds: 12 },
    items: [
      { exerciseId: 'halo', reps: 10, unit: 'reps' },
      { exerciseId: 'kb-grave-digger', reps: 8, unit: 'side' },
      { exerciseId: 'leg-raise', reps: 12, unit: 'reps' },
      { exerciseId: 'butterfly-kicks', reps: 30, unit: 'reps' },
      { exerciseId: 'kb-tactical-crossover', reps: 8, unit: 'side' },
      { exerciseId: 'kb-front-back-raise', reps: 10, unit: 'reps' },
    ],
  },
  {
    id: 'preset-chipper',
    preset: true,
    name: 'The Kettlebell Chipper',
    timer: { type: 'fortime', cap: 25, rounds: 1 },
    items: [
      { exerciseId: 'kb-swing', reps: 50, unit: 'reps' },
      { exerciseId: 'kb-goblet-squat', reps: 40, unit: 'reps' },
      { exerciseId: 'pushup', reps: 30, unit: 'reps' },
      { exerciseId: 'combo-clean-press', reps: 10, unit: 'side' },
      { exerciseId: 'kb-snatch', reps: 10, unit: 'side' },
    ],
  },
  {
    id: 'preset-upper-intervals',
    preset: true,
    name: 'Upper Body Pump',
    timer: { type: 'intervals', work: 40, rest: 20, rounds: 12 },
    items: [
      { exerciseId: 'kb-floor-press', reps: 40, unit: 'sec' },
      { exerciseId: 'kb-curl', reps: 40, unit: 'sec' },
      { exerciseId: 'kb-overhead-triceps', reps: 40, unit: 'sec' },
      { exerciseId: 'kb-high-pull', reps: 40, unit: 'sec' },
    ],
  },
  {
    id: 'preset-hinge-emom',
    preset: true,
    name: 'Hinge Strength E2MOM',
    timer: { type: 'emom', interval: 120, rounds: 8 },
    items: [
      { exerciseId: 'kb-double-deadlift', reps: 8, unit: 'reps' },
      { exerciseId: 'kb-single-leg-deadlift', reps: 6, unit: 'side' },
      { exerciseId: 'kb-stiff-leg-deadlift', reps: 10, unit: 'reps' },
      { exerciseId: 'kb-bottoms-up', reps: 5, unit: 'side' },
    ],
  },
  {
    id: 'preset-legs-tabata',
    preset: true,
    name: 'Leg Burner Tabata',
    timer: { type: 'tabata', work: 20, rest: 10, rounds: 8 },
    items: [
      { exerciseId: 'kb-double-front-squat', reps: 20, unit: 'sec' },
      { exerciseId: 'squat', reps: 20, unit: 'sec' },
    ],
  },
  {
    id: 'preset-full-body-rounds',
    preset: true,
    name: '5 Rounds Full Body',
    timer: { type: 'fortime', cap: 30, rounds: 5 },
    items: [
      { exerciseId: 'combo-clean-squat-press', reps: 5, unit: 'side' },
      { exerciseId: 'kb-swing', reps: 15, unit: 'reps' },
      { exerciseId: 'combo-pushup-row', reps: 8, unit: 'reps' },
      { exerciseId: 'butterfly-kicks', reps: 20, unit: 'reps' },
    ],
  },
];
