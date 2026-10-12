// Timer engine. Pure segment maths + a small pausable clock.
//
// A timer config is turned into a flat list of segments. Each segment has a
// duration in seconds (Infinity for an open-ended "for time" without a cap).
// The UI asks `stateAt(segments, elapsed)` what should be on screen.

export const TIMER_TYPES = [
  { id: 'amrap', label: 'AMRAP', blurb: 'As many rounds as possible in a set time' },
  { id: 'emom', label: 'EMOM', blurb: 'Every minute (or interval) on the minute' },
  { id: 'fortime', label: 'For Time', blurb: 'Finish the work as fast as possible' },
  { id: 'intervals', label: 'Intervals', blurb: 'Work / rest intervals for a number of rounds' },
  { id: 'tabata', label: 'Tabata', blurb: '20s work / 10s rest × 8 rounds' },
];

export const DEFAULT_TIMER = {
  amrap: { type: 'amrap', minutes: 12 },
  emom: { type: 'emom', interval: 60, rounds: 10 },
  fortime: { type: 'fortime', cap: 20, rounds: 1 },
  intervals: { type: 'intervals', work: 40, rest: 20, rounds: 10 },
  tabata: { type: 'tabata', work: 20, rest: 10, rounds: 8 },
};

export function normalizeTimer(t) {
  const type = t && DEFAULT_TIMER[t.type] ? t.type : 'amrap';
  return { ...DEFAULT_TIMER[type], ...t, type };
}

/** Short summary such as "AMRAP 12 min" or "EMOM 10 × 1:00". */
export function describeTimer(t) {
  t = normalizeTimer(t);
  switch (t.type) {
    case 'amrap':
      return `AMRAP ${t.minutes} min`;
    case 'emom':
      return t.interval === 60 ? `EMOM ${t.rounds} min` : `Every ${formatTime(t.interval)} × ${t.rounds}`;
    case 'fortime':
      return (
        (t.rounds > 1 ? `${t.rounds} Rounds For Time` : 'For Time') + (t.cap > 0 ? ` (${t.cap} min cap)` : '')
      );
    case 'intervals':
      return `${t.rounds} × ${t.work}s on / ${t.rest}s off`;
    case 'tabata':
      return `Tabata ${t.rounds} × ${t.work}/${t.rest}`;
  }
  return '';
}

/** Total length of the workout in seconds (Infinity if open-ended). Excludes prep. */
export function totalDuration(t) {
  return buildSegments(t, 0).reduce((sum, s) => sum + s.duration, 0);
}

export function buildSegments(t, prepSeconds = 10) {
  t = normalizeTimer(t);
  const segs = [];
  if (prepSeconds > 0) {
    segs.push({ kind: 'prep', duration: prepSeconds, round: 0, rounds: 0, countUp: false });
  }
  switch (t.type) {
    case 'amrap':
      segs.push({ kind: 'work', duration: t.minutes * 60, round: 1, rounds: 1, countUp: false });
      break;
    case 'fortime':
      segs.push({
        kind: 'work',
        duration: t.cap > 0 ? t.cap * 60 : Infinity,
        round: 1,
        rounds: 1,
        countUp: true,
      });
      break;
    case 'emom':
      for (let i = 1; i <= t.rounds; i++) {
        segs.push({ kind: 'work', duration: t.interval, round: i, rounds: t.rounds, countUp: false });
      }
      break;
    case 'intervals':
    case 'tabata':
      for (let i = 1; i <= t.rounds; i++) {
        segs.push({ kind: 'work', duration: t.work, round: i, rounds: t.rounds, countUp: false });
        // No trailing rest after the final round.
        if (t.rest > 0 && i < t.rounds) {
          segs.push({ kind: 'rest', duration: t.rest, round: i, rounds: t.rounds, countUp: false });
        }
      }
      break;
  }
  return segs;
}

/**
 * Where are we at `elapsed` seconds into the segment list?
 * Returns the active segment, its index, time in/left, and whether we're done.
 */
export function stateAt(segments, elapsed) {
  let start = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const end = start + seg.duration;
    if (elapsed < end) {
      const inSeg = elapsed - start;
      return {
        index: i,
        segment: seg,
        elapsedInSegment: inSeg,
        remainingInSegment: seg.duration - inSeg,
        done: false,
      };
    }
    start = end;
  }
  const last = segments[segments.length - 1];
  return {
    index: segments.length - 1,
    segment: last,
    elapsedInSegment: last ? last.duration : 0,
    remainingInSegment: 0,
    done: true,
  };
}

/** Seconds spent in work segments (excludes prep) up to `elapsed`. */
export function workElapsed(segments, elapsed) {
  let start = 0;
  let work = 0;
  for (const seg of segments) {
    if (elapsed <= start) break;
    const spent = Math.min(seg.duration, elapsed - start);
    if (seg.kind !== 'prep') work += spent;
    start += seg.duration;
  }
  return work;
}

export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '∞';
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return (h ? `${h}:` : '') + `${mm}:${String(sec).padStart(2, '0')}`;
}

/**
 * Pausable wall-clock. Uses absolute timestamps so the time stays correct
 * even when the browser throttles timers (e.g. the phone screen dims).
 */
export class Clock {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.reset();
  }
  reset() {
    this.running = false;
    this.startedAt = 0;
    this.accumulated = 0;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.startedAt = this.now();
  }
  pause() {
    if (!this.running) return;
    this.accumulated += this.now() - this.startedAt;
    this.running = false;
  }
  /** Elapsed seconds. */
  elapsed() {
    const ms = this.accumulated + (this.running ? this.now() - this.startedAt : 0);
    return ms / 1000;
  }
}
