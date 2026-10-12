// Built-in exercise library.
//
// category: 'bodyweight' | 'kettlebell' | 'combo'
// unilateral: performed one side at a time (reps are usually "per side")
// parts (combos only): one combo rep = every part performed once, in order.

export const CATEGORIES = [
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'combo', label: 'Combos' },
];

export const EXERCISES = [
  // ---------- Kettlebell ----------
  {
    id: 'halo',
    name: 'Halo',
    category: 'kettlebell',
    muscles: ['shoulders', 'core'],
    cues: 'Hold the bell upside down by the horns at chest height. Circle it tightly around your head, keeping ribs down and glutes squeezed. Alternate directions.',
  },
  {
    id: 'kb-swing',
    name: 'Kettlebell Swing',
    category: 'kettlebell',
    muscles: ['glutes', 'hamstrings', 'core'],
    cues: 'Hike the bell back between your legs, then snap the hips forward to float it to chest height. Arms are ropes — the power comes from the hips.',
  },
  {
    id: 'kb-gorilla-row',
    name: 'Kettlebell Gorilla Row',
    category: 'kettlebell',
    muscles: ['back', 'biceps', 'core'],
    cues: 'Two bells on the floor between your feet, hinge into a wide stance. Row one bell to your hip while pressing the other into the floor, then alternate.',
  },
  {
    id: 'kb-tactical-crossover',
    name: 'Kettlebell Tactical Crossover',
    category: 'kettlebell',
    muscles: ['core', 'obliques', 'shoulders'],
    cues: 'From a hinge or half-kneeling position, pass the bell diagonally across the body from hip to opposite shoulder and back, controlling the rotation through the trunk.',
  },
  {
    id: 'kb-front-back-raise',
    name: 'Kettlebell Front to Back Raise',
    category: 'kettlebell',
    muscles: ['shoulders', 'core'],
    cues: 'Hold the bell by the horns with straight arms. Raise it in front to eye level, lower, then take it behind you as far as is comfortable. Keep the torso still.',
  },
  {
    id: 'kb-grave-digger',
    name: 'Kettlebell Grave Digger',
    category: 'kettlebell',
    muscles: ['obliques', 'core', 'shoulders'],
    cues: 'Hold the bell by the horns. Rotate and "dig" it down to the outside of one foot, then drive it diagonally up over the opposite shoulder. Pivot the feet, alternate sides.',
  },
  {
    id: 'kb-goblet-squat',
    name: 'Kettlebell Goblet Squat',
    category: 'kettlebell',
    muscles: ['quads', 'glutes', 'core'],
    cues: 'Hold the bell by the horns at your chest, elbows tucked. Sit down between your heels with a tall chest, then drive the floor away to stand.',
  },
  {
    id: 'kb-stiff-leg-deadlift',
    name: 'Kettlebell Stiff Leg Deadlift',
    category: 'kettlebell',
    muscles: ['hamstrings', 'glutes', 'lower back'],
    cues: 'Soft knees, flat back. Push the hips back and lower the bell along your legs until you feel the hamstrings stretch, then squeeze the glutes to stand.',
  },
  {
    id: 'kb-single-leg-deadlift',
    name: 'Kettlebell Single Leg Deadlift',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['hamstrings', 'glutes', 'balance'],
    cues: 'Bell in one hand, balance on the opposite leg. Hinge forward while the free leg reaches back, hips square to the floor. Return to tall standing.',
  },
  {
    id: 'kb-double-front-squat',
    name: 'Double Kettlebell Front Squat',
    category: 'kettlebell',
    muscles: ['quads', 'glutes', 'core', 'upper back'],
    cues: 'Two bells in the front rack, forearms vertical, elbows tight. Squat to depth keeping the chest up, then drive up through mid-foot.',
  },
  {
    id: 'kb-clean',
    name: 'Kettlebell Clean',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['glutes', 'hamstrings', 'back', 'shoulders'],
    cues: 'Hike the bell back, snap the hips and keep the bell close as you guide it into the rack. Rotate the hand around the handle so the bell lands softly on the forearm.',
  },
  {
    id: 'kb-press',
    name: 'Kettlebell Press',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['shoulders', 'triceps', 'core'],
    cues: 'From the rack, brace the glutes and abs and press the bell straight overhead until the bicep is by your ear. Lower under control back to the rack.',
  },
  {
    id: 'kb-snatch',
    name: 'Kettlebell Snatch',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['glutes', 'hamstrings', 'shoulders', 'grip'],
    cues: 'Swing the bell back, drive the hips and high-pull it up, then punch the hand through to lock out overhead in one smooth motion. Avoid the bell flipping onto the wrist.',
  },
  {
    id: 'kb-double-deadlift',
    name: 'Kettlebell Double Deadlift',
    category: 'kettlebell',
    muscles: ['glutes', 'hamstrings', 'back', 'grip'],
    cues: 'Two bells between the feet. Hinge, grip both handles, set the lats and stand up tall by driving the hips forward. Lower with a flat back.',
  },
  {
    id: 'kb-floor-press',
    name: 'Kettlebell Floor Press',
    category: 'kettlebell',
    muscles: ['chest', 'triceps', 'shoulders'],
    cues: 'Lie on your back, knees bent, bell(s) in hand with the upper arm on the floor. Press to lockout over the shoulder, then lower until the elbow touches down.',
  },
  {
    id: 'kb-bottoms-up',
    name: 'Kettlebell Bottoms Up Press',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['shoulders', 'grip', 'core'],
    cues: 'Hold the bell upside down by the handle, bottom pointing to the ceiling. Crush the grip, keep the wrist straight and press overhead while keeping it balanced.',
  },
  {
    id: 'kb-high-pull',
    name: 'Kettlebell High Pull',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['upper back', 'shoulders', 'glutes'],
    cues: 'Swing the bell back, drive the hips and, as it floats, pull the elbow back high so the bell comes to chest height. Let it fall back into the next swing.',
  },
  {
    id: 'kb-curl',
    name: 'Kettlebell Curl',
    category: 'kettlebell',
    muscles: ['biceps', 'forearms'],
    cues: 'Hold the bell by the handle or horns, elbows pinned to your sides. Curl to the shoulders without swinging, lower slowly.',
  },
  {
    id: 'kb-overhead-triceps',
    name: 'Kettlebell Overhead Triceps Extension',
    category: 'kettlebell',
    muscles: ['triceps'],
    cues: 'Hold the bell by the horns overhead. Keeping elbows pointed forward and close, lower it behind your head then extend back to lockout.',
  },
  {
    id: 'kb-single-arm-swing',
    name: 'Single Arm Kettlebell Swing',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['glutes', 'hamstrings', 'core', 'grip'],
    cues: 'Same as a two-handed swing, one hand on the bell. Resist the rotation and keep the shoulder packed.',
  },
  {
    id: 'kb-russian-twist',
    name: 'Kettlebell Russian Twist',
    category: 'kettlebell',
    muscles: ['obliques', 'core'],
    cues: 'Sit with knees bent, lean back slightly and hold the bell at your chest. Rotate side to side, tapping the bell beside each hip.',
  },
  {
    id: 'kb-turkish-get-up',
    name: 'Kettlebell Turkish Get-Up',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['full body', 'shoulders', 'core'],
    cues: 'Eyes on the bell, arm locked out overhead. Roll to elbow, to hand, bridge, sweep the leg through to a kneel, then stand. Reverse every step to return.',
  },
  {
    id: 'kb-windmill',
    name: 'Kettlebell Windmill',
    category: 'kettlebell',
    unilateral: true,
    muscles: ['obliques', 'shoulders', 'hamstrings'],
    cues: 'Bell locked out overhead, feet angled away from it. Push the hip out and slide the free hand down the leg, eyes on the bell, then return to standing.',
  },
  {
    id: 'kb-thruster',
    name: 'Kettlebell Thruster',
    category: 'kettlebell',
    muscles: ['quads', 'glutes', 'shoulders'],
    cues: 'Front squat with the bell(s) in the rack, then use the drive out of the bottom to press overhead in one fluid movement.',
  },
  {
    id: 'kb-renegade-row',
    name: 'Kettlebell Renegade Row',
    category: 'kettlebell',
    muscles: ['back', 'core', 'chest'],
    cues: 'High plank on two bells, feet wide. Row one bell to the hip without rotating the hips, place it down, alternate.',
  },
  {
    id: 'kb-around-the-world',
    name: 'Kettlebell Around the World',
    category: 'kettlebell',
    muscles: ['core', 'grip', 'shoulders'],
    cues: 'Pass the bell around your waist from hand to hand, staying tall and braced. Change direction each set.',
  },
  {
    id: 'kb-figure-8',
    name: 'Kettlebell Figure 8',
    category: 'kettlebell',
    muscles: ['core', 'grip', 'hamstrings'],
    cues: 'In a half squat/hinge, pass the bell between the legs in a figure-of-eight pattern, hand to hand.',
  },

  // ---------- Bodyweight ----------
  {
    id: 'pushup',
    name: 'Push-up',
    category: 'bodyweight',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    cues: 'Hands under shoulders, body in a straight line. Lower until the chest is just off the floor, elbows ~45°, then press back up.',
  },
  {
    id: 'squat',
    name: 'Air Squat',
    category: 'bodyweight',
    muscles: ['quads', 'glutes'],
    cues: 'Feet shoulder-width, sit the hips back and down below parallel with a tall chest, knees tracking over toes. Stand fully.',
  },
  {
    id: 'leg-raise',
    name: 'Leg Raise',
    category: 'bodyweight',
    muscles: ['lower abs', 'hip flexors'],
    cues: 'Lie flat, lower back pressed into the floor. Raise straight legs to vertical, lower slowly without letting the back arch.',
  },
  {
    id: 'butterfly-kicks',
    name: 'Butterfly Kicks',
    category: 'bodyweight',
    muscles: ['lower abs', 'hip flexors'],
    cues: 'Lie on your back, legs a few inches off the floor. Make small, fast scissor kicks while keeping the lower back flat. Count each kick.',
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    category: 'bodyweight',
    unilateral: true,
    muscles: ['quads', 'glutes'],
    cues: 'Step one foot back and lower the back knee towards the floor, front shin vertical. Drive through the front heel to return. Hold a bell in the rack to load it.',
  },
  {
    id: 'burpee',
    name: 'Burpee',
    category: 'bodyweight',
    muscles: ['full body'],
    cues: 'Drop to the floor chest down, push up, jump the feet in and jump up with a clap overhead.',
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    category: 'bodyweight',
    muscles: ['core', 'shoulders', 'hip flexors'],
    cues: 'High plank, drive the knees to the chest alternately at speed. Keep the hips level.',
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'bodyweight',
    muscles: ['core'],
    cues: 'Forearms under shoulders, body straight from head to heels. Squeeze glutes and quads, breathe. Usually done for time.',
  },
  {
    id: 'situp',
    name: 'Sit-up',
    category: 'bodyweight',
    muscles: ['abs', 'hip flexors'],
    cues: 'Lie back with knees bent, sit all the way up to touch your toes, lower under control.',
  },
  {
    id: 'jumping-jack',
    name: 'Jumping Jack',
    category: 'bodyweight',
    muscles: ['conditioning'],
    cues: 'Jump the feet wide while swinging the arms overhead, then back together.',
  },
  {
    id: 'jump-squat',
    name: 'Jump Squat',
    category: 'bodyweight',
    muscles: ['quads', 'glutes', 'power'],
    cues: 'Squat to parallel then explode upward. Land softly and go straight into the next rep.',
  },
  {
    id: 'v-up',
    name: 'V-up',
    category: 'bodyweight',
    muscles: ['abs'],
    cues: 'Lie flat with arms overhead. Simultaneously lift straight legs and torso to touch your toes, then lower.',
  },
  {
    id: 'hollow-hold',
    name: 'Hollow Hold',
    category: 'bodyweight',
    muscles: ['core'],
    cues: 'Lower back glued to the floor, arms and legs extended and hovering. Hold the banana shape. Usually done for time.',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'bodyweight',
    muscles: ['glutes', 'hamstrings'],
    cues: 'On your back, knees bent, drive through the heels to lift the hips until the body is straight from knees to shoulders. Squeeze at the top.',
  },

  // ---------- Combos ----------
  {
    id: 'combo-swing-squat',
    name: 'Swing + Goblet Squat Combo',
    category: 'combo',
    parts: [
      { exerciseId: 'kb-swing', reps: 2 },
      { exerciseId: 'kb-goblet-squat', reps: 4 },
    ],
    cues: 'Two swings, then catch the bell by the horns and perform four goblet squats. That is one rep.',
  },
  {
    id: 'combo-clean-press',
    name: 'Clean & Press',
    category: 'combo',
    parts: [
      { exerciseId: 'kb-clean', reps: 1 },
      { exerciseId: 'kb-press', reps: 1 },
    ],
    cues: 'Clean the bell to the rack, then press overhead. Per side.',
  },
  {
    id: 'combo-clean-squat-press',
    name: 'Clean, Squat & Press',
    category: 'combo',
    parts: [
      { exerciseId: 'kb-clean', reps: 1 },
      { exerciseId: 'kb-goblet-squat', reps: 1 },
      { exerciseId: 'kb-press', reps: 1 },
    ],
    cues: 'Clean to the rack, squat with the bell racked, stand and press. Per side.',
  },
  {
    id: 'combo-deadlift-high-pull',
    name: 'Deadlift + High Pull',
    category: 'combo',
    parts: [
      { exerciseId: 'kb-stiff-leg-deadlift', reps: 1 },
      { exerciseId: 'kb-high-pull', reps: 1 },
    ],
    cues: 'One deadlift then flow straight into a high pull.',
  },
  {
    id: 'combo-halo-squat',
    name: 'Halo + Goblet Squat',
    category: 'combo',
    parts: [
      { exerciseId: 'halo', reps: 2 },
      { exerciseId: 'kb-goblet-squat', reps: 1 },
    ],
    cues: 'One halo each direction, then a goblet squat.',
  },
  {
    id: 'combo-swing-snatch',
    name: 'Swing + Snatch',
    category: 'combo',
    parts: [
      { exerciseId: 'kb-single-arm-swing', reps: 2 },
      { exerciseId: 'kb-snatch', reps: 1 },
    ],
    cues: 'Two single arm swings and a snatch on the same side.',
  },
  {
    id: 'combo-lunge-press',
    name: 'Reverse Lunge + Press',
    category: 'combo',
    parts: [
      { exerciseId: 'reverse-lunge', reps: 1 },
      { exerciseId: 'kb-press', reps: 1 },
    ],
    cues: 'Bell in the rack. Reverse lunge on the same side, stand and press.',
  },
  {
    id: 'combo-pushup-row',
    name: 'Push-up + Gorilla Row',
    category: 'combo',
    parts: [
      { exerciseId: 'pushup', reps: 1 },
      { exerciseId: 'kb-gorilla-row', reps: 2 },
    ],
    cues: 'One push-up, stand up into the hinge and row each side once.',
  },
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

/** Look up an exercise among the built-ins plus any extras (e.g. user combos). */
export function findExercise(id, extras = []) {
  return byId.get(id) || extras.find((e) => e.id === id) || null;
}

/** Human readable breakdown of a combo, e.g. "2× Kettlebell Swing → 4× Kettlebell Goblet Squat". */
export function describeCombo(combo, extras = []) {
  if (!combo.parts) return '';
  return combo.parts
    .map((p) => {
      const ex = findExercise(p.exerciseId, extras);
      return `${p.reps}× ${ex ? ex.name : 'Unknown'}`;
    })
    .join(' → ');
}
