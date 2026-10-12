import { EXERCISES, CATEGORIES, findExercise, describeCombo } from './exercises.js';
import {
  TIMER_TYPES,
  DEFAULT_TIMER,
  normalizeTimer,
  describeTimer,
  buildSegments,
  stateAt,
  workElapsed,
  formatTime,
  totalDuration,
  Clock,
} from './timer.js';
import { store, uid } from './store.js';
import { PRESET_WODS } from './presets.js';
import { generateWod, FOCUSES, EQUIPMENT } from './generator.js';
import { unlock, sounds, say, keepAwake } from './audio.js';

// ---------------------------------------------------------------- state

let settings = store.getSettings();
let combos = store.getCombos();
let userWods = store.getWods();
let log = store.getLog();

const ui = {
  lib: { q: '', cat: 'all' },
  random: { type: 'any', minutes: 15, focus: 'full', equipment: 'mixed', result: null },
  quick: { ...DEFAULT_TIMER.amrap },
  draft: null, // WOD being edited
  comboDraft: null,
  pendingDraft: null, // handed from the random generator to the editor
};

let session = null; // active workout

// ---------------------------------------------------------------- helpers

const $main = document.getElementById('main');
const $title = document.getElementById('title');
const $back = document.getElementById('back');
const $tabs = document.getElementById('tabs');
const $banner = document.getElementById('banner');

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ex = (id) => findExercise(id, combos);
const allExercises = () => EXERCISES.concat(combos);
const allWods = () => userWods.concat(PRESET_WODS);
const getWod = (id) => allWods().find((w) => w.id === id) || null;
const clone = (o) => JSON.parse(JSON.stringify(o));
const go = (hash) => (location.hash = hash);

const UNIT_LABELS = { reps: 'reps', side: 'reps / side', sec: 'seconds' };

function itemAmount(item) {
  if (item.unit === 'sec') return `${item.reps}s`;
  if (item.unit === 'side') return `${item.reps}/side`;
  return `${item.reps}`;
}

function itemLabel(item) {
  const e = ex(item.exerciseId);
  return `${itemAmount(item)} ${item.unit === 'sec' ? '' : '× '}${e ? e.name : 'Unknown exercise'}`;
}

function itemWeight(item) {
  return item.weight ? `${item.weight} ${settings.unit}` : '';
}

function spokenItem(item) {
  if (!item) return '';
  const e = ex(item.exerciseId);
  const name = e ? e.name : '';
  if (item.unit === 'sec') return name;
  if (item.unit === 'side') return `${item.reps} ${name}, each side`;
  return `${item.reps} ${name}`;
}

function catLabel(cat) {
  return (CATEGORIES.find((c) => c.id === cat) || {}).label || cat;
}

function chip(label, active, action, value) {
  return `<button class="chip${active ? ' active' : ''}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
}

function numberField(label, key, value, { min = 0, max = 999, step = 1, suffix = '' } = {}) {
  return `<label class="field">
    <span>${esc(label)}</span>
    <div class="num">
      <button type="button" class="num-btn" data-action="step" data-key="${key}" data-step="${-step}" data-min="${min}" data-max="${max}" aria-label="Decrease">−</button>
      <input type="number" inputmode="numeric" data-bind="${key}" value="${esc(value)}" min="${min}" max="${max}" step="${step}">
      <button type="button" class="num-btn" data-action="step" data-key="${key}" data-step="${step}" data-min="${min}" data-max="${max}" aria-label="Increase">+</button>
      ${suffix ? `<span class="suffix">${esc(suffix)}</span>` : ''}
    </div>
  </label>`;
}

/** Timer type picker + parameter fields. `prefix` namespaces data-bind keys. */
function timerFields(t, prefix) {
  t = normalizeTimer(t);
  const types = TIMER_TYPES.map((tt) => chip(tt.label, tt.id === t.type, `${prefix}-type`, tt.id)).join('');
  let fields = '';
  switch (t.type) {
    case 'amrap':
      fields = numberField('Time cap', `${prefix}.minutes`, t.minutes, { min: 1, max: 120, suffix: 'min' });
      break;
    case 'emom':
      fields =
        numberField('Every', `${prefix}.interval`, t.interval, { min: 10, max: 600, step: 15, suffix: 'sec' }) +
        numberField('Rounds', `${prefix}.rounds`, t.rounds, { min: 1, max: 100 });
      break;
    case 'fortime':
      fields =
        numberField('Rounds', `${prefix}.rounds`, t.rounds, { min: 1, max: 50 }) +
        numberField('Time cap (0 = none)', `${prefix}.cap`, t.cap, { min: 0, max: 180, suffix: 'min' });
      break;
    case 'intervals':
    case 'tabata':
      fields =
        numberField('Work', `${prefix}.work`, t.work, { min: 5, max: 600, step: 5, suffix: 'sec' }) +
        numberField('Rest', `${prefix}.rest`, t.rest, { min: 0, max: 600, step: 5, suffix: 'sec' }) +
        numberField('Rounds', `${prefix}.rounds`, t.rounds, { min: 1, max: 100 });
      break;
  }
  const total = totalDuration(t);
  const blurb = (TIMER_TYPES.find((tt) => tt.id === t.type) || {}).blurb || '';
  return `<div class="chips wrap">${types}</div>
    <p class="muted small">${esc(blurb)}${Number.isFinite(total) ? ` · total ${formatTime(total)}` : ''}</p>
    <div class="fields">${fields}</div>`;
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}

function wodCard(w) {
  const names = w.items.map((i) => (ex(i.exerciseId) || {}).name || 'Unknown').join(' · ');
  return `<a class="card wod-card" href="#/wod/${esc(w.id)}">
    <div class="row between">
      <strong>${esc(w.name)}</strong>
      <span class="badge badge-${esc(normalizeTimer(w.timer).type)}">${esc(describeTimer(w.timer))}</span>
    </div>
    <p class="muted small clamp">${esc(names)}</p>
  </a>`;
}

function exerciseRow(e, action = null) {
  const sub =
    e.category === 'combo'
      ? describeCombo(e, combos)
      : (e.muscles || []).join(', ') + (e.unilateral ? ' · per side' : '');
  const attrs = action ? `data-action="${action}" data-id="${esc(e.id)}"` : `href="#/exercise/${esc(e.id)}"`;
  const tag = action ? 'button' : 'a';
  return `<${tag} class="list-item" ${attrs}>
    <span class="dot dot-${esc(e.category)}"></span>
    <span class="grow">
      <span class="li-title">${esc(e.name)}${e.custom ? ' <span class="tiny-badge">Mine</span>' : ''}</span>
      <span class="li-sub">${esc(sub)}</span>
    </span>
    <span class="chev">›</span>
  </${tag}>`;
}

function filterExercises({ q, cat }, list = allExercises()) {
  const needle = q.trim().toLowerCase();
  return list
    .filter((e) => cat === 'all' || e.category === cat)
    .filter((e) => !needle || e.name.toLowerCase().includes(needle) || (e.muscles || []).some((m) => m.includes(needle)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function saveUserWods() {
  store.saveWods(userWods);
}

// ---------------------------------------------------------------- exercise picker (bottom sheet)

function openPicker({ title = 'Add exercise', excludeCombos = false, onPick }) {
  const state = { q: '', cat: 'all' };
  const sheet = document.createElement('div');
  sheet.className = 'sheet-backdrop';
  sheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-head">
      <strong>${esc(title)}</strong>
      <button class="link" data-close>Done</button>
    </div>
    <input class="search" type="search" placeholder="Search exercises or muscles" autocomplete="off">
    <div class="chips"></div>
    <div class="list sheet-list"></div>
  </div>`;
  const $list = sheet.querySelector('.sheet-list');
  const $chips = sheet.querySelector('.chips');
  const cats = [{ id: 'all', label: 'All' }, ...CATEGORIES.filter((c) => !(excludeCombos && c.id === 'combo'))];

  const draw = () => {
    $chips.innerHTML = cats.map((c) => chip(c.label, state.cat === c.id, 'pick-cat', c.id)).join('');
    let list = allExercises();
    if (excludeCombos) list = list.filter((e) => e.category !== 'combo');
    const items = filterExercises(state, list);
    $list.innerHTML = items.length
      ? items.map((e) => exerciseRow(e, 'pick')).join('')
      : '<p class="muted center pad">No exercises match.</p>';
  };
  const close = () => sheet.remove();

  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) return close();
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'pick-cat') {
      state.cat = btn.dataset.value;
      draw();
    } else if (btn.dataset.action === 'pick') {
      onPick(btn.dataset.id);
      btn.classList.add('picked');
      setTimeout(() => btn.classList.remove('picked'), 400);
    }
  });
  sheet.querySelector('.search').addEventListener('input', (e) => {
    state.q = e.target.value;
    draw();
  });
  draw();
  document.body.appendChild(sheet);
}

// ---------------------------------------------------------------- views

const views = {};

views.home = () => ({
  title: 'KB WOD',
  tab: 'home',
  html: `
    <div class="actions-grid">
      <a class="big-btn primary" href="#/edit/new"><span class="big-icon">＋</span>New WOD</a>
      <a class="big-btn" href="#/random"><span class="big-icon">⚄</span>Random WOD</a>
    </div>
    ${
      userWods.length
        ? `<h2>My WODs</h2><div class="stack">${userWods.map(wodCard).join('')}</div>`
        : ''
    }
    <h2>Featured WODs</h2>
    <div class="stack">${PRESET_WODS.map(wodCard).join('')}</div>`,
});

views.wod = ([id]) => {
  const w = getWod(id);
  if (!w) return views.notFound();
  const t = normalizeTimer(w.timer);
  const rotates = ['emom', 'intervals', 'tabata'].includes(t.type);
  return {
    title: w.name,
    back: '#/',
    tab: 'home',
    html: `
      <div class="card">
        <span class="badge badge-${t.type}">${esc(describeTimer(t))}</span>
        <p class="muted small">${
          rotates && w.items.length > 1
            ? 'Movements rotate each round, in order.'
            : t.type === 'amrap'
              ? 'Complete the list in order, repeat until time runs out. Tap “+ Round” after each round.'
              : t.type === 'fortime'
                ? `Complete ${t.rounds > 1 ? `${t.rounds} rounds of ` : ''}the list as fast as you can.`
                : ''
        }</p>
        <ol class="movements">
          ${w.items
            .map((i) => {
              const e = ex(i.exerciseId);
              return `<li>
                <a href="#/exercise/${esc(i.exerciseId)}"><strong>${esc(itemLabel(i))}</strong></a>
                ${itemWeight(i) ? `<span class="weight">${esc(itemWeight(i))}</span>` : ''}
                ${e && e.parts ? `<div class="muted small">${esc(describeCombo(e, combos))}</div>` : ''}
              </li>`;
            })
            .join('')}
        </ol>
      </div>
      <button class="btn primary block lg" data-action="start">▶ Start workout</button>
      <div class="row gap">
        ${
          w.preset
            ? `<button class="btn grow" data-action="duplicate">Copy &amp; edit</button>`
            : `<a class="btn grow" href="#/edit/${esc(w.id)}">Edit</a>
               <button class="btn grow" data-action="duplicate">Duplicate</button>
               <button class="btn danger grow" data-action="delete">Delete</button>`
        }
      </div>`,
    actions: {
      start: () => startSession(w, w.timer),
      duplicate: () => {
        ui.pendingDraft = { ...clone(w), id: null, preset: false, name: `${w.name} (copy)` };
        go('#/edit/new');
      },
      delete: () => {
        if (!confirm(`Delete “${w.name}”?`)) return;
        userWods = userWods.filter((x) => x.id !== w.id);
        saveUserWods();
        go('#/');
      },
    },
  };
};

views.edit = ([id]) => {
  // Initialise the draft once per visit.
  if (!ui.draft || ui.draft._for !== id) {
    let base;
    if (id === 'new') {
      base = ui.pendingDraft || { name: '', timer: { ...DEFAULT_TIMER.amrap }, items: [] };
      ui.pendingDraft = null;
    } else {
      base = getWod(id);
      if (!base || base.preset) return views.notFound();
    }
    ui.draft = { ...clone(base), _for: id };
  }
  const d = ui.draft;
  d.timer = normalizeTimer(d.timer);

  return {
    title: id === 'new' ? 'New WOD' : 'Edit WOD',
    back: id === 'new' ? '#/' : `#/wod/${id}`,
    tab: 'home',
    html: `
      <label class="field">
        <span>Name</span>
        <input type="text" data-bind="name" value="${esc(d.name)}" placeholder="e.g. Monday Burner" maxlength="60">
      </label>
      <h2>Timer</h2>
      ${timerFields(d.timer, 'timer')}
      <h2>Movements</h2>
      <div class="stack">
        ${
          d.items.length
            ? d.items
                .map((item, i) => {
                  const e = ex(item.exerciseId);
                  return `<div class="card item-edit">
                    <div class="row between">
                      <strong>${i + 1}. ${esc(e ? e.name : 'Unknown exercise')}</strong>
                      <div class="row">
                        <button class="icon-btn" data-action="item-up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
                        <button class="icon-btn" data-action="item-down" data-i="${i}" ${i === d.items.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
                        <button class="icon-btn danger" data-action="item-remove" data-i="${i}" aria-label="Remove">✕</button>
                      </div>
                    </div>
                    ${e && e.parts ? `<p class="muted small">1 rep = ${esc(describeCombo(e, combos))}</p>` : ''}
                    <div class="row gap wrap">
                      ${numberField('Amount', `items.${i}.reps`, item.reps, { min: 1, max: 999 })}
                      <label class="field">
                        <span>Unit</span>
                        <select data-bind="items.${i}.unit">
                          ${Object.entries(UNIT_LABELS)
                            .map(([k, v]) => `<option value="${k}" ${item.unit === k ? 'selected' : ''}>${v}</option>`)
                            .join('')}
                        </select>
                      </label>
                      ${
                        e && e.category !== 'bodyweight'
                          ? `<label class="field narrow">
                              <span>Weight (${esc(settings.unit)})</span>
                              <input type="text" inputmode="decimal" data-bind="items.${i}.weight" value="${esc(item.weight || '')}" placeholder="—">
                            </label>`
                          : ''
                      }
                    </div>
                  </div>`;
                })
                .join('')
            : '<p class="muted center">No movements yet.</p>'
        }
      </div>
      <button class="btn block" data-action="add-item">＋ Add exercise</button>
      <div class="row gap sticky-actions">
        <a class="btn grow" href="${id === 'new' ? '#/' : `#/wod/${esc(id)}`}" data-action="cancel">Cancel</a>
        <button class="btn primary grow" data-action="save">Save</button>
      </div>`,
    onInput(key, value) {
      if (key.endsWith('.reps') || key.startsWith('timer.')) value = Number(value) || 0;
      setPath(d, key, value);
      if (key.startsWith('timer.')) refreshTotals();
      return key.endsWith('.unit'); // re-render not needed except to keep things tidy
    },
    actions: {
      'timer-type': (el) => {
        d.timer = { ...DEFAULT_TIMER[el.dataset.value] };
        render();
      },
      'add-item': () =>
        openPicker({
          onPick: (exId) => {
            const e = ex(exId);
            const isTimed = ['intervals', 'tabata'].includes(d.timer.type);
            d.items.push({
              exerciseId: exId,
              reps: isTimed ? d.timer.work : 10,
              unit: isTimed ? 'sec' : e && e.unilateral ? 'side' : 'reps',
            });
            render();
          },
        }),
      'item-up': (el) => {
        const i = +el.dataset.i;
        [d.items[i - 1], d.items[i]] = [d.items[i], d.items[i - 1]];
        render();
      },
      'item-down': (el) => {
        const i = +el.dataset.i;
        [d.items[i + 1], d.items[i]] = [d.items[i], d.items[i + 1]];
        render();
      },
      'item-remove': (el) => {
        d.items.splice(+el.dataset.i, 1);
        render();
      },
      cancel: () => {
        ui.draft = null;
      },
      save: () => {
        if (!d.items.length) return alert('Add at least one exercise.');
        const wod = {
          id: d.id || uid('wod'),
          name: d.name.trim() || `${describeTimer(d.timer)} WOD`,
          timer: normalizeTimer(d.timer),
          items: d.items.map((i) => ({ ...i, reps: Math.max(1, Number(i.reps) || 1) })),
        };
        const idx = userWods.findIndex((w) => w.id === wod.id);
        if (idx >= 0) userWods[idx] = wod;
        else userWods.unshift(wod);
        saveUserWods();
        ui.draft = null;
        go(`#/wod/${wod.id}`);
      },
    },
  };
};

views.random = () => {
  const r = ui.random;
  const res = r.result;
  return {
    title: 'Random WOD',
    back: '#/',
    tab: 'home',
    html: `
      <h2>Format</h2>
      <div class="chips wrap">
        ${chip('Surprise me', r.type === 'any', 'r-type', 'any')}
        ${TIMER_TYPES.map((t) => chip(t.label, r.type === t.id, 'r-type', t.id)).join('')}
      </div>
      ${r.type === 'tabata' ? '' : numberField('Approx. length', 'minutes', r.minutes, { min: 4, max: 60, suffix: 'min' })}
      <h2>Focus</h2>
      <div class="chips wrap">${FOCUSES.map((f) => chip(f.label, r.focus === f.id, 'r-focus', f.id)).join('')}</div>
      <h2>Equipment</h2>
      <div class="chips wrap">${EQUIPMENT.map((e) => chip(e.label, r.equipment === e.id, 'r-equipment', e.id)).join('')}</div>
      <button class="btn primary block lg" data-action="generate">⚄ ${res ? 'Regenerate' : 'Generate'}</button>
      ${
        res
          ? `<div class="card">
              <div class="row between"><strong>${esc(res.name)}</strong>
              <span class="badge badge-${res.timer.type}">${esc(describeTimer(res.timer))}</span></div>
              <ol class="movements">${res.items
                .map((i) => {
                  const e = ex(i.exerciseId);
                  return `<li><strong>${esc(itemLabel(i))}</strong>${
                    e && e.parts ? `<div class="muted small">${esc(describeCombo(e, combos))}</div>` : ''
                  }</li>`;
                })
                .join('')}</ol>
            </div>
            <div class="row gap">
              <button class="btn grow" data-action="edit-random">Save &amp; edit</button>
              <button class="btn primary grow" data-action="start-random">▶ Start</button>
            </div>`
          : ''
      }`,
    onInput(key, value) {
      if (key === 'minutes') r.minutes = Number(value) || 15;
    },
    actions: {
      'r-type': (el) => ((r.type = el.dataset.value), render()),
      'r-focus': (el) => ((r.focus = el.dataset.value), render()),
      'r-equipment': (el) => ((r.equipment = el.dataset.value), render()),
      generate: () => {
        r.result = generateWod({ ...r, extras: combos });
        render();
      },
      'start-random': () => startSession(res, res.timer),
      'edit-random': () => {
        ui.pendingDraft = clone(res);
        go('#/edit/new');
      },
    },
  };
};

views.timer = () => ({
  title: 'Quick Timer',
  tab: 'timer',
  html: `
    <p class="muted">Just need a clock? Pick a format and go.</p>
    ${timerFields(ui.quick, 'quick')}
    <button class="btn primary block lg" data-action="start">▶ Start</button>`,
  onInput(key, value) {
    setPath(ui, key, Number(value) || 0);
    refreshTotals();
  },
  actions: {
    'quick-type': (el) => {
      ui.quick = { ...DEFAULT_TIMER[el.dataset.value] };
      render();
    },
    start: () => startSession(null, ui.quick),
  },
});

views.library = () => {
  const s = ui.lib;
  const cats = [{ id: 'all', label: 'All' }, ...CATEGORIES];
  const drawList = () => {
    const list = filterExercises(s);
    return list.length ? list.map((e) => exerciseRow(e)).join('') : '<p class="muted center pad">No exercises match.</p>';
  };
  return {
    title: 'Exercise Library',
    tab: 'library',
    html: `
      <input class="search" type="search" data-bind="q" value="${esc(s.q)}" placeholder="Search exercises or muscles" autocomplete="off">
      <div class="chips">${cats.map((c) => chip(c.label, s.cat === c.id, 'lib-cat', c.id)).join('')}</div>
      <a class="btn block" href="#/combo/new">＋ Build a combo</a>
      <div class="list" id="lib-list">${drawList()}</div>`,
    onInput(key, value) {
      s.q = value;
      document.getElementById('lib-list').innerHTML = drawList();
    },
    actions: {
      'lib-cat': (el) => ((s.cat = el.dataset.value), render()),
    },
  };
};

views.exercise = ([id]) => {
  const e = ex(id);
  if (!e) return views.notFound();
  return {
    title: e.name,
    back: '#/library',
    tab: 'library',
    html: `
      <div class="card">
        <div class="row gap"><span class="dot dot-${e.category}"></span><strong>${esc(catLabel(e.category))}</strong>
          ${e.unilateral ? '<span class="tiny-badge">Per side</span>' : ''}
          ${e.custom ? '<span class="tiny-badge">Mine</span>' : ''}</div>
        ${
          e.parts
            ? `<h3>One rep =</h3><ol class="movements">${e.parts
                .map((p) => {
                  const pe = ex(p.exerciseId);
                  return `<li><a href="#/exercise/${esc(p.exerciseId)}">${p.reps}× ${esc(pe ? pe.name : 'Unknown')}</a></li>`;
                })
                .join('')}</ol>`
            : ''
        }
        ${e.muscles ? `<h3>Targets</h3><p>${esc(e.muscles.join(', '))}</p>` : ''}
        ${e.cues ? `<h3>How to</h3><p>${esc(e.cues)}</p>` : ''}
      </div>
      ${
        e.custom
          ? `<div class="row gap">
              <a class="btn grow" href="#/combo/${esc(e.id)}">Edit combo</a>
              <button class="btn danger grow" data-action="delete">Delete</button>
            </div>`
          : ''
      }`,
    actions: {
      delete: () => {
        const usedIn = userWods.filter((w) => w.items.some((i) => i.exerciseId === e.id));
        const msg = usedIn.length
          ? `“${e.name}” is used in ${usedIn.length} WOD(s). Delete anyway?`
          : `Delete “${e.name}”?`;
        if (!confirm(msg)) return;
        combos = combos.filter((c) => c.id !== e.id);
        store.saveCombos(combos);
        go('#/library');
      },
    },
  };
};

views.combo = ([id]) => {
  if (!ui.comboDraft || ui.comboDraft._for !== id) {
    if (id === 'new') {
      ui.comboDraft = { name: '', cues: '', parts: [], _for: id };
    } else {
      const c = combos.find((x) => x.id === id);
      if (!c) return views.notFound();
      ui.comboDraft = { ...clone(c), _for: id };
    }
  }
  const d = ui.comboDraft;
  return {
    title: id === 'new' ? 'New Combo' : 'Edit Combo',
    back: id === 'new' ? '#/library' : `#/exercise/${id}`,
    tab: 'library',
    html: `
      <p class="muted">A combo is a sequence of movements that together count as <strong>one rep</strong> —
        e.g. 2 swings + 4 goblet squats.</p>
      <label class="field"><span>Name</span>
        <input type="text" data-bind="name" value="${esc(d.name)}" placeholder="Auto-named if left blank" maxlength="60">
      </label>
      <h2>One rep =</h2>
      <div class="stack">
        ${
          d.parts.length
            ? d.parts
                .map((p, i) => {
                  const e = ex(p.exerciseId);
                  return `<div class="card row between gap">
                    <strong class="grow">${esc(e ? e.name : 'Unknown')}</strong>
                    ${numberField('×', `parts.${i}.reps`, p.reps, { min: 1, max: 50 })}
                    <button class="icon-btn danger" data-action="part-remove" data-i="${i}" aria-label="Remove">✕</button>
                  </div>`;
                })
                .join('<div class="then">then</div>')
            : '<p class="muted center">Add two or more movements.</p>'
        }
      </div>
      <button class="btn block" data-action="add-part">＋ Add movement</button>
      <label class="field"><span>Notes (optional)</span>
        <textarea data-bind="cues" rows="3" placeholder="Coaching cues, e.g. switch hands every rep">${esc(d.cues)}</textarea>
      </label>
      <div class="row gap sticky-actions">
        <a class="btn grow" href="${id === 'new' ? '#/library' : `#/exercise/${esc(id)}`}" data-action="cancel">Cancel</a>
        <button class="btn primary grow" data-action="save">Save combo</button>
      </div>`,
    onInput(key, value) {
      setPath(d, key, key.endsWith('.reps') ? Number(value) || 1 : value);
    },
    actions: {
      'add-part': () =>
        openPicker({
          title: 'Add movement',
          excludeCombos: true,
          onPick: (exId) => {
            d.parts.push({ exerciseId: exId, reps: 1 });
            render();
          },
        }),
      'part-remove': (el) => {
        d.parts.splice(+el.dataset.i, 1);
        render();
      },
      cancel: () => (ui.comboDraft = null),
      save: () => {
        if (d.parts.length < 2) return alert('A combo needs at least two movements.');
        const parts = d.parts.map((p) => ({ exerciseId: p.exerciseId, reps: Math.max(1, Number(p.reps) || 1) }));
        const combo = {
          id: d.id || uid('combo'),
          custom: true,
          category: 'combo',
          name:
            d.name.trim() ||
            parts.map((p) => `${p.reps} ${(ex(p.exerciseId) || {}).name || ''}`.trim()).join(' + '),
          parts,
          unilateral: parts.some((p) => (ex(p.exerciseId) || {}).unilateral),
          cues: d.cues.trim(),
        };
        const idx = combos.findIndex((c) => c.id === combo.id);
        if (idx >= 0) combos[idx] = combo;
        else combos.push(combo);
        store.saveCombos(combos);
        ui.comboDraft = null;
        go(`#/exercise/${combo.id}`);
      },
    },
  };
};

views.log = () => {
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeek = log.filter((l) => new Date(l.date).getTime() >= weekAgo).length;
  const totalMin = Math.round(log.reduce((s, l) => s + (l.duration || 0), 0) / 60);
  return {
    title: 'Workout Log',
    tab: 'log',
    html: `
      <div class="stats">
        <div class="stat"><span class="stat-num">${log.length}</span><span class="stat-label">Workouts</span></div>
        <div class="stat"><span class="stat-num">${thisWeek}</span><span class="stat-label">Last 7 days</span></div>
        <div class="stat"><span class="stat-num">${totalMin}</span><span class="stat-label">Minutes</span></div>
      </div>
      ${
        log.length
          ? `<div class="stack">${log
              .map(
                (l) => `<div class="card">
                  <div class="row between">
                    <strong>${esc(l.wodName)}</strong>
                    <button class="icon-btn" data-action="del-log" data-id="${esc(l.id)}" aria-label="Delete entry">✕</button>
                  </div>
                  <p class="muted small">${esc(
                    new Date(l.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
                  )} · ${esc(l.timerDesc)}</p>
                  <p class="result">${esc(l.result)}</p>
                  ${l.notes ? `<p class="small">${esc(l.notes)}</p>` : ''}
                </div>`,
              )
              .join('')}</div>`
          : '<p class="muted center pad">No workouts logged yet. Finish a WOD to see it here.</p>'
      }`,
    actions: {
      'del-log': (el) => {
        if (!confirm('Delete this log entry?')) return;
        log = log.filter((l) => l.id !== el.dataset.id);
        store.saveLog(log);
        render();
      },
    },
  };
};

views.settings = () => ({
  title: 'Settings',
  back: '#/',
  html: `
    <div class="card stack">
      <label class="field"><span>Get-ready countdown</span>
        <select data-bind="prepSeconds">
          ${[0, 5, 10, 15, 20, 30].map((n) => `<option value="${n}" ${settings.prepSeconds === n ? 'selected' : ''}>${n ? `${n} seconds` : 'Off'}</option>`).join('')}
        </select>
      </label>
      <label class="toggle"><input type="checkbox" data-bind="sound" ${settings.sound ? 'checked' : ''}><span>Beeps</span></label>
      <label class="toggle"><input type="checkbox" data-bind="voice" ${settings.voice ? 'checked' : ''}><span>Announce exercises (voice)</span></label>
      <label class="field"><span>Weight unit</span>
        <select data-bind="unit">
          <option value="kg" ${settings.unit === 'kg' ? 'selected' : ''}>kg</option>
          <option value="lb" ${settings.unit === 'lb' ? 'selected' : ''}>lb</option>
        </select>
      </label>
    </div>
    <h2>Install on iPhone</h2>
    <div class="card">
      <ol class="small">
        <li>Open this page in <strong>Safari</strong>.</li>
        <li>Tap the <strong>Share</strong> button.</li>
        <li>Choose <strong>Add to Home Screen</strong>.</li>
      </ol>
      <p class="muted small">It then opens full-screen like a native app and works offline.
        Keep the ringer on (or use headphones) to hear the beeps.</p>
    </div>
    <h2>Your data</h2>
    <div class="card stack">
      <p class="muted small">Workouts, combos and your log are stored on this device. Export a backup to move them to another device.</p>
      <div class="row gap">
        <button class="btn grow" data-action="export">Export backup</button>
        <label class="btn grow">Import backup<input type="file" accept="application/json,.json" data-action-change="import" hidden></label>
      </div>
      <button class="btn danger" data-action="reset">Erase all data</button>
    </div>
    <p class="muted small center">KB WOD · v1</p>`,
  onInput(key, value, el) {
    settings[key] = el.type === 'checkbox' ? el.checked : key === 'prepSeconds' ? Number(value) : value;
    store.saveSettings(settings);
  },
  actions: {
    export: () => {
      const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kbwod-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    import: async (el) => {
      const file = el.files && el.files[0];
      if (!file) return;
      try {
        store.importAll(JSON.parse(await file.text()));
        reloadState();
        alert('Backup imported.');
        render();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    },
    reset: () => {
      if (!confirm('Erase all your WODs, combos, log and settings? This cannot be undone.')) return;
      store.saveWods([]);
      store.saveCombos([]);
      store.saveLog([]);
      store.saveSettings({});
      reloadState();
      go('#/');
    },
  },
});

views.notFound = () => ({
  title: 'Not found',
  back: '#/',
  html: '<p class="muted center pad">That page doesn’t exist.</p><a class="btn block" href="#/">Home</a>',
});

function reloadState() {
  settings = store.getSettings();
  combos = store.getCombos();
  userWods = store.getWods();
  log = store.getLog();
}

// ---------------------------------------------------------------- workout session

function startSession(wod, timer) {
  unlock(); // must happen inside the tap handler for iOS audio
  const t = normalizeTimer(timer);
  session = {
    wod: wod ? clone(wod) : null,
    timer: t,
    segments: buildSegments(t, settings.prepSeconds),
    clock: new Clock(),
    rounds: 0,
    lastIndex: -1,
    lastSecond: null,
    saidMinute: false,
    finished: false,
    capped: false,
    finalWork: 0,
    interval: null,
  };
  go('#/run');
  resumeSession();
}

function resumeSession() {
  if (!session || session.finished) return;
  unlock();
  session.clock.start();
  keepAwake(true);
  clearInterval(session.interval);
  session.interval = setInterval(tick, 100);
  tick();
}

function pauseSession() {
  if (!session) return;
  session.clock.pause();
  clearInterval(session.interval);
  keepAwake(false);
}

function endSession() {
  if (session) clearInterval(session.interval);
  keepAwake(false);
  session = null;
}

function currentItem(seg) {
  const items = session.wod ? session.wod.items : [];
  if (!items.length || !seg || seg.round < 1) return null;
  return items[(seg.round - 1) % items.length];
}

function rotates() {
  return ['emom', 'intervals', 'tabata'].includes(session.timer.type);
}

function onSegmentStart(st) {
  const seg = st.segment;
  session.lastSecond = null;
  if (seg.kind === 'prep') {
    if (settings.voice) {
      const first = rotates() ? currentItem({ round: 1 }) : null;
      say(first ? `Get ready. First up, ${spokenItem(first)}` : 'Get ready');
    }
    return;
  }
  if (settings.sound) (seg.kind === 'rest' ? sounds.rest : sounds.go)();
  if (!settings.voice) return;
  if (seg.kind === 'rest') {
    const next = rotates() ? currentItem({ round: seg.round + 1 }) : null;
    say(next ? `Rest. Next, ${spokenItem(next)}` : 'Rest');
  } else if (rotates()) {
    const item = currentItem(seg);
    say(item ? spokenItem(item) : `Round ${seg.round}`);
  } else {
    say('Go');
  }
}

function tick() {
  if (!session || session.finished) return;
  const elapsed = session.clock.elapsed();
  const st = stateAt(session.segments, elapsed);

  if (st.done) return finishSession({ capped: session.timer.type === 'fortime' });

  if (st.index !== session.lastIndex) {
    session.lastIndex = st.index;
    onSegmentStart(st);
    if (location.hash === '#/run') render();
  }

  const seg = st.segment;
  if (Number.isFinite(seg.duration)) {
    const left = Math.ceil(st.remainingInSegment);
    if (left <= 3 && left >= 1 && left !== session.lastSecond) {
      session.lastSecond = left;
      if (settings.sound) sounds.tick();
    }
    if (seg.kind === 'work' && seg.duration >= 180 && !session.saidMinute && st.remainingInSegment <= 60) {
      session.saidMinute = true;
      if (settings.voice) say('One minute left');
    }
  }
  updateRunDisplay(st);
}

function updateRunDisplay(st) {
  const $time = document.getElementById('run-time');
  if (!$time) return;
  const seg = st.segment;
  const shown = seg.countUp ? st.elapsedInSegment : Math.ceil(st.remainingInSegment);
  $time.textContent = formatTime(shown);
  const $bar = document.getElementById('run-bar');
  if ($bar) {
    const pct = Number.isFinite(seg.duration) ? (st.elapsedInSegment / seg.duration) * 100 : 0;
    $bar.style.width = `${Math.min(100, pct)}%`;
  }
  const $total = document.getElementById('run-total');
  if ($total) $total.textContent = formatTime(workElapsed(session.segments, session.clock.elapsed()));
}

function finishSession({ capped = false } = {}) {
  if (!session || session.finished) return;
  session.finalWork = workElapsed(session.segments, session.clock.elapsed());
  session.clock.pause();
  clearInterval(session.interval);
  session.finished = true;
  session.capped = capped;
  keepAwake(false);
  if (settings.sound) sounds.finish();
  if (settings.voice) say(capped ? 'Time cap. Well done' : 'Workout complete. Well done');
  if (location.hash === '#/run') render();
}

views.run = () => {
  if (!session) {
    return {
      title: 'Timer',
      tab: 'timer',
      html: '<p class="muted center pad">No workout running.</p><a class="btn block" href="#/timer">Quick timer</a>',
    };
  }
  return session.finished ? runResultView() : runActiveView();
};

function runActiveView() {
  const s = session;
  const elapsed = s.clock.elapsed();
  const st = stateAt(s.segments, elapsed);
  const seg = st.segment;
  const running = s.clock.running;
  const started = elapsed > 0 || running;
  const t = s.timer;
  const items = s.wod ? s.wod.items : [];
  const counting = ['amrap', 'fortime'].includes(t.type);

  let phase = 'Ready';
  if (seg.kind === 'prep') phase = 'Get ready';
  else if (seg.kind === 'rest') phase = 'Rest';
  else phase = counting ? (t.type === 'amrap' ? 'AMRAP' : 'For time') : 'Work';

  const roundInfo =
    seg.kind === 'prep' || counting ? '' : `Round ${seg.round} / ${seg.rounds}`;

  let body = '';
  if (rotates() && items.length) {
    const cur = seg.kind === 'work' ? currentItem(seg) : null;
    const nextRound = seg.kind === 'prep' ? 1 : seg.round + 1;
    const next = nextRound <= (seg.rounds || t.rounds) ? currentItem({ round: nextRound }) : null;
    body = `
      ${cur ? `<div class="now"><span class="label">Now</span><span class="now-name">${esc(itemLabel(cur))}</span>
        ${itemWeight(cur) ? `<span class="weight">${esc(itemWeight(cur))}</span>` : ''}
        ${ex(cur.exerciseId)?.parts ? `<span class="small">${esc(describeCombo(ex(cur.exerciseId), combos))}</span>` : ''}</div>` : ''}
      ${next ? `<div class="next"><span class="label">Next</span> ${esc(itemLabel(next))}</div>` : ''}`;
  } else if (items.length) {
    body = `<ol class="movements run-list">${items
      .map((i) => {
        const e = ex(i.exerciseId);
        return `<li><strong>${esc(itemLabel(i))}</strong>${itemWeight(i) ? ` <span class="weight">${esc(itemWeight(i))}</span>` : ''}
          ${e && e.parts ? `<div class="small muted">${esc(describeCombo(e, combos))}</div>` : ''}</li>`;
      })
      .join('')}</ol>`;
  }

  const roundTarget = t.type === 'fortime' && t.rounds > 1 ? ` / ${t.rounds}` : '';

  return {
    title: s.wod ? s.wod.name : describeTimer(t),
    fullscreen: true,
    html: `
      <div class="run phase-${seg.kind}${running ? '' : ' paused'}">
        <div class="run-top">
          <button class="link" data-action="exit">✕ Exit</button>
          <span class="run-desc">${esc(describeTimer(t))}</span>
          <span class="run-elapsed" id="run-total">${formatTime(workElapsed(s.segments, elapsed))}</span>
        </div>
        <div class="run-phase">${esc(phase)}${roundInfo ? ` · ${esc(roundInfo)}` : ''}</div>
        <div class="run-time" id="run-time">${formatTime(seg.countUp ? st.elapsedInSegment : Math.ceil(st.remainingInSegment))}</div>
        <div class="run-progress"><div id="run-bar"></div></div>
        ${
          counting && seg.kind !== 'prep'
            ? `<div class="rounds">
                <button class="icon-btn lg" data-action="round-minus" aria-label="Remove round">−</button>
                <div class="rounds-num"><span>${s.rounds}${roundTarget}</span><small>rounds</small></div>
                <button class="btn primary round-btn" data-action="round-plus">＋ Round</button>
              </div>`
            : ''
        }
        <div class="run-body">${body}</div>
        <div class="run-controls">
          ${
            running
              ? `<button class="btn lg grow" data-action="pause">❚❚ Pause</button>`
              : `<button class="btn primary lg grow" data-action="resume">▶ ${started ? 'Resume' : 'Start'}</button>`
          }
          ${
            t.type === 'fortime' && seg.kind !== 'prep'
              ? `<button class="btn success lg grow" data-action="done">✓ Done</button>`
              : started
                ? `<button class="btn lg" data-action="end">End</button>`
                : ''
          }
        </div>
      </div>`,
    actions: {
      pause: () => (pauseSession(), render()),
      resume: () => (resumeSession(), render()),
      'round-plus': () => {
        s.rounds++;
        if (settings.sound) sounds.tick();
        if (t.type === 'fortime' && t.rounds > 1 && s.rounds >= t.rounds) return finishSession();
        render();
      },
      'round-minus': () => {
        s.rounds = Math.max(0, s.rounds - 1);
        render();
      },
      done: () => finishSession(),
      end: () => {
        if (confirm('End the workout now?')) finishSession();
      },
      exit: () => {
        if (s.clock.elapsed() > 0 && !confirm('Exit without saving this workout?')) return;
        endSession();
        go(s.wod && s.wod.id && getWod(s.wod.id) ? `#/wod/${s.wod.id}` : '#/timer');
      },
    },
  };
}

function runResultView() {
  const s = session;
  const t = s.timer;
  const name = s.wod ? s.wod.name : 'Quick timer';
  let fields = '';
  if (t.type === 'amrap' || (t.type === 'fortime' && s.capped)) {
    fields = `<div class="row gap">
      ${numberField('Rounds', 'rounds', s.rounds, { min: 0, max: 999 })}
      ${numberField('+ Reps', 'extraReps', 0, { min: 0, max: 999 })}
    </div>`;
  } else if (t.type === 'fortime') {
    fields = `<label class="field"><span>Time</span><input type="text" data-bind="time" value="${esc(formatTime(s.finalWork))}"></label>`;
  }
  return {
    title: 'Workout complete',
    fullscreen: true,
    html: `
      <div class="run phase-done">
        <div class="done-hero">
          <div class="done-icon">🏆</div>
          <h1>${s.capped ? 'Time cap!' : 'Nice work!'}</h1>
          <p>${esc(name)} · ${esc(describeTimer(t))}</p>
          <p class="run-time small-time">${formatTime(s.finalWork)}</p>
        </div>
        <div class="card stack result-form">
          ${fields}
          <label class="field"><span>Notes</span>
            <textarea data-bind="notes" rows="3" placeholder="Weights used, how it felt…"></textarea>
          </label>
        </div>
        <div class="run-controls">
          <button class="btn lg" data-action="discard">Discard</button>
          <button class="btn primary lg grow" data-action="save">Save to log</button>
        </div>
      </div>`,
    onInput(key, value) {
      s.form = s.form || {};
      s.form[key] = value;
    },
    actions: {
      discard: () => {
        if (!confirm('Discard this workout?')) return;
        endSession();
        go('#/');
      },
      save: () => {
        const f = s.form || {};
        let result;
        if (t.type === 'amrap' || (t.type === 'fortime' && s.capped)) {
          const r = Number(f.rounds ?? s.rounds) || 0;
          const reps = Number(f.extraReps) || 0;
          result = `${s.capped ? 'Capped · ' : ''}${r} round${r === 1 ? '' : 's'}${reps ? ` + ${reps} reps` : ''}`;
        } else if (t.type === 'fortime') {
          result = `Time: ${f.time || formatTime(s.finalWork)}`;
        } else {
          const total = totalDuration(t);
          result = s.finalWork >= total - 0.5 ? 'Completed' : `Stopped at ${formatTime(s.finalWork)} of ${formatTime(total)}`;
        }
        log.unshift({
          id: uid('log'),
          date: new Date().toISOString(),
          wodId: s.wod ? s.wod.id : null,
          wodName: name,
          timerDesc: describeTimer(t),
          result,
          notes: (f.notes || '').trim(),
          duration: Math.round(s.finalWork),
        });
        store.saveLog(log);
        endSession();
        go('#/log');
      },
    },
  };
}

// ---------------------------------------------------------------- router + rendering

const routes = [
  [/^#?\/?$/, 'home'],
  [/^#\/wod\/([^/]+)$/, 'wod'],
  [/^#\/edit\/([^/]+)$/, 'edit'],
  [/^#\/random$/, 'random'],
  [/^#\/timer$/, 'timer'],
  [/^#\/run$/, 'run'],
  [/^#\/library$/, 'library'],
  [/^#\/exercise\/([^/]+)$/, 'exercise'],
  [/^#\/combo\/([^/]+)$/, 'combo'],
  [/^#\/log$/, 'log'],
  [/^#\/settings$/, 'settings'],
];

let current = null;

function resolve() {
  const hash = location.hash || '#/';
  for (const [re, name] of routes) {
    const m = hash.match(re);
    if (m) return views[name](m.slice(1).map(decodeURIComponent));
  }
  return views.notFound();
}

function render() {
  const scrollY = window.scrollY;
  const sameRoute = current && current._hash === location.hash;
  current = resolve();
  current._hash = location.hash;

  document.body.classList.toggle('fullscreen', !!current.fullscreen);
  $title.textContent = current.title || 'KB WOD';
  document.title = current.title && current.title !== 'KB WOD' ? `${current.title} · KB WOD` : 'KB WOD';
  $back.hidden = !current.back;
  if (current.back) $back.setAttribute('href', current.back);
  for (const a of $tabs.querySelectorAll('a')) a.classList.toggle('active', a.dataset.tab === current.tab);

  const showBanner = session && !session.finished && location.hash !== '#/run';
  $banner.hidden = !showBanner;

  $main.innerHTML = current.html;
  window.scrollTo(0, sameRoute ? scrollY : 0);
}

function refreshTotals() {
  // Re-render only the "total" hint without losing input focus.
  const p = $main.querySelector('.fields')?.previousElementSibling;
  if (!p || !current) return;
  const t = location.hash === '#/timer' ? ui.quick : ui.draft && ui.draft.timer;
  if (!t) return;
  const total = totalDuration(t);
  const blurb = (TIMER_TYPES.find((tt) => tt.id === normalizeTimer(t).type) || {}).blurb || '';
  p.textContent = `${blurb}${Number.isFinite(total) ? ` · total ${formatTime(total)}` : ''}`;
}

$main.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !current) return;
  const action = el.dataset.action;
  if (action === 'step') {
    e.preventDefault();
    const input = el.parentElement.querySelector('input');
    const step = Number(el.dataset.step);
    const v = Math.min(Number(el.dataset.max), Math.max(Number(el.dataset.min), (Number(input.value) || 0) + step));
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const fn = current.actions && current.actions[action];
  if (fn) {
    e.preventDefault();
    fn(el, e);
    // Navigation links that also carry an action (e.g. cancel) still navigate.
    if (el.tagName === 'A' && el.getAttribute('href')) go(el.getAttribute('href'));
  }
});

function handleInput(e) {
  const el = e.target;
  if (el.dataset.actionChange && e.type === 'change') {
    const fn = current.actions && current.actions[el.dataset.actionChange];
    if (fn) fn(el, e);
    return;
  }
  const key = el.dataset.bind;
  if (!key || !current || !current.onInput) return;
  const value = el.type === 'checkbox' ? el.checked : el.value;
  const rerender = current.onInput(key, value, el);
  if (rerender) render();
}
$main.addEventListener('input', handleInput);
$main.addEventListener('change', (e) => {
  // selects / checkboxes / file inputs
  if (e.target.matches('select, input[type=checkbox], input[type=file]')) handleInput(e);
});

window.addEventListener('hashchange', () => {
  // Leaving the run screen pauses the clock; the banner lets you jump back.
  if (session && !session.finished && location.hash !== '#/run' && session.clock.running) pauseSession();
  render();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && session && session.clock.running) {
    keepAwake(true);
    tick();
  }
});

$banner.addEventListener('click', () => go('#/run'));

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
