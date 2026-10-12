import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, findExercise, describeCombo } from '../js/exercises.js';
import { buildSegments, stateAt, workElapsed, formatTime, totalDuration, describeTimer, Clock } from '../js/timer.js';
import { PRESET_WODS } from '../js/presets.js';
import { generateWod } from '../js/generator.js';

const REQUIRED = [
  'Halo', 'Kettlebell Swing', 'Kettlebell Gorilla Row', 'Kettlebell Tactical Crossover',
  'Kettlebell Front to Back Raise', 'Kettlebell Grave Digger', 'Push-up', 'Air Squat', 'Leg Raise',
  'Butterfly Kicks', 'Kettlebell Goblet Squat', 'Kettlebell Stiff Leg Deadlift',
  'Kettlebell Single Leg Deadlift', 'Reverse Lunge', 'Double Kettlebell Front Squat', 'Kettlebell Clean',
  'Kettlebell Press', 'Kettlebell Snatch', 'Kettlebell Double Deadlift', 'Kettlebell Floor Press',
  'Kettlebell Bottoms Up Press', 'Kettlebell High Pull', 'Kettlebell Curl', 'Kettlebell Overhead Triceps Extension',
];

test('library contains every required exercise', () => {
  const names = new Set(EXERCISES.map((e) => e.name));
  for (const n of REQUIRED) assert.ok(names.has(n), `missing ${n}`);
});

test('exercise ids are unique and combos reference real exercises', () => {
  const ids = EXERCISES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of EXERCISES.filter((e) => e.category === 'combo')) {
    assert.ok(c.parts.length >= 2, c.id);
    for (const p of c.parts) assert.ok(findExercise(p.exerciseId), `${c.id} -> ${p.exerciseId}`);
  }
  assert.equal(
    describeCombo(findExercise('combo-swing-squat')),
    '2× Kettlebell Swing → 4× Kettlebell Goblet Squat',
  );
});

test('presets reference real exercises', () => {
  for (const w of PRESET_WODS) for (const i of w.items) assert.ok(findExercise(i.exerciseId), `${w.id}: ${i.exerciseId}`);
});

test('AMRAP segments and state', () => {
  const segs = buildSegments({ type: 'amrap', minutes: 10 }, 10);
  assert.equal(segs.length, 2);
  assert.equal(stateAt(segs, 5).segment.kind, 'prep');
  const st = stateAt(segs, 70);
  assert.equal(st.segment.kind, 'work');
  assert.equal(st.remainingInSegment, 540);
  assert.equal(stateAt(segs, 610).done, true);
  assert.equal(workElapsed(segs, 70), 60);
});

test('EMOM rounds', () => {
  const segs = buildSegments({ type: 'emom', interval: 60, rounds: 5 }, 0);
  assert.equal(segs.length, 5);
  assert.equal(stateAt(segs, 125).segment.round, 3);
  assert.equal(totalDuration({ type: 'emom', interval: 120, rounds: 8 }), 960);
});

test('intervals/tabata have no trailing rest', () => {
  const segs = buildSegments({ type: 'tabata' }, 0);
  assert.equal(segs.length, 15);
  assert.equal(segs.at(-1).kind, 'work');
  assert.equal(totalDuration({ type: 'tabata' }), 8 * 20 + 7 * 10);
});

test('for time counts up, open-ended without a cap', () => {
  const capped = buildSegments({ type: 'fortime', cap: 10 }, 0);
  assert.equal(capped[0].countUp, true);
  assert.equal(stateAt(capped, 601).done, true);
  const open = buildSegments({ type: 'fortime', cap: 0 }, 0);
  assert.equal(stateAt(open, 99999).done, false);
  assert.equal(describeTimer({ type: 'fortime', cap: 0, rounds: 3 }), '3 Rounds For Time');
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(3725), '1:02:05');
  assert.equal(formatTime(Infinity), '∞');
});

test('clock pauses', () => {
  let t = 0;
  const c = new Clock(() => t);
  c.start(); t = 5000; c.pause(); t = 9000;
  assert.equal(c.elapsed(), 5);
  c.start(); t = 10000;
  assert.equal(c.elapsed(), 6);
});

test('generator produces valid WODs for every combination', () => {
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const type of ['any', 'amrap', 'emom', 'fortime', 'intervals', 'tabata'])
    for (const focus of ['full', 'upper', 'lower', 'core'])
      for (const equipment of ['mixed', 'kettlebell', 'bodyweight'])
        for (let n = 0; n < 5; n++) {
          const w = generateWod({ type, minutes: 15, focus, equipment, rand });
          assert.ok(w.items.length >= 1);
          for (const i of w.items) {
            assert.ok(findExercise(i.exerciseId));
            assert.ok(i.reps >= 1);
          }
          assert.ok(totalDuration(w.timer) > 0);
        }
});
