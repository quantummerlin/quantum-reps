import * as program from '../modules/program.js';
import * as settings from '../modules/settings.js';
import {
  ADVICE_TEXT, MAX_ENTRY, MAX_REPS, MIN_REPS, SETS_PER_EXERCISE,
  validateSession, volumeLoad, weightAdvice,
} from '../modules/logger.js';
import { dayLabel, groupByDay, journalEntries, recentExercises } from '../modules/journal.js';
import { TREND_ICON, TREND_LABEL, TREND_MESSAGE, evaluate, volumeDelta } from '../modules/progress.js';
import { fromKg, toKg } from '../modules/units.js';
import { h, icon } from '../modules/ui.js';
import { refresh } from '../nav.js';
import { openGoalDialog } from './dialogs.js';
import { $, badge, unit, viewTitle, weightText } from './shared.js';

const PAGE = 30;
const blank = () => ({ name: '', weightKg: null, weightTouched: false, sets: ['', '', ''] });

// The draft is the single source of truth for every input, so re-renders never lose typing.
let draft = blank();
let result = null;
let error = '';
let limit = PAGE;
const els = { reps: [] };

const matched = () => program.findByName(draft.name);
const signed = (n) => `${n > 0 ? '+' : ''}${n}%`;

const currentSession = () => ({
  date: new Date().toISOString(),
  weight: draft.weightKg ?? 0,
  sets: draft.sets.map(Number),
});

function dismissResult() {
  error = '';
  if (els.error) els.error.textContent = '';
  if (!result) return;
  result = null;
  $('#result')?.remove();
}

function updatePreview() {
  const session = currentSession();
  if (validateSession(session)) {
    const entered = draft.sets.filter((value) => value !== '').length;
    els.preview.textContent = entered ? `${entered} of ${SETS_PER_EXERCISE} sets entered` : '';
    els.advice.textContent = '';
    return;
  }
  const load = volumeLoad(session);
  const last = matched()?.sessions.at(-1);
  const delta = last ? volumeDelta(volumeLoad(last), load) : null;
  els.preview.textContent = `Volume ${weightText(load)}${delta === null ? '' : ` (${signed(delta)} vs last)`}`;
  els.advice.textContent = ADVICE_TEXT[weightAdvice(session.sets)];
}

// Called when the typed name changes: pulls in the exercise's last weight and result.
function refreshContext() {
  const exercise = matched();
  if (exercise && !draft.weightTouched) {
    draft.weightKg = exercise.weight;
    els.weight.value = fromKg(exercise.weight, unit());
  }
  const last = exercise?.sessions.at(-1);
  els.last.textContent = last ? `Last time: ${weightText(last.weight)} x ${last.sets.join(' / ')}` : '';
  updatePreview();
}

function pick(exercise) {
  draft = { ...blank(), name: exercise.name, weightKg: exercise.weight };
  dismissResult();
  render();
  els.reps[0].focus();
}

// Used by the rep calculator; the journal renders when the tab opens.
export function prefillWeight(kg) {
  draft.weightKg = kg;
  draft.weightTouched = true;
  dismissResult();
}

/* Form */

function weightControl() {
  const step = unit() === 'lb' ? 5 : 2.5;
  const input = h('input', {
    type: 'number',
    inputmode: 'decimal',
    min: 0,
    step,
    value: draft.weightKg ? fromKg(draft.weightKg, unit()) : '',
    placeholder: '0',
    'aria-label': `Weight in ${unit()}`,
  });
  const apply = () => {
    const number = Number(input.value);
    draft.weightTouched = true;
    draft.weightKg = input.value !== '' && Number.isFinite(number) && number > 0 ? toKg(number, unit()) : null;
    dismissResult();
    updatePreview();
  };
  input.addEventListener('input', apply);
  const bump = (delta) => () => {
    const next = Math.max(0, Math.round(((Number(input.value) || 0) + delta) * 10) / 10);
    input.value = next || '';
    apply();
  };
  els.weight = input;
  return h('div', { class: 'set-row' },
    h('span', { class: 'set-badge set-w' }, unit().toUpperCase()),
    h('button', { class: 'btn btn-ghost step-btn', type: 'button', 'aria-label': 'Decrease weight', onClick: bump(-step) }, '-'),
    input,
    h('button', { class: 'btn btn-ghost step-btn', type: 'button', 'aria-label': 'Increase weight', onClick: bump(step) }, '+'));
}

function repStepper(index) {
  const input = h('input', {
    type: 'number',
    inputmode: 'numeric',
    min: 1,
    max: MAX_ENTRY,
    step: 1,
    placeholder: '0',
    value: draft.sets[index],
    'aria-label': `Failure ${index + 1} reps`,
    onInput: (event) => {
      draft.sets[index] = event.target.value;
      dismissResult();
      updatePreview();
    },
  });
  const bump = (delta) => () => {
    const next = Math.min(MAX_ENTRY, Math.max(0, (Number(input.value) || 0) + delta));
    input.value = next || '';
    draft.sets[index] = input.value;
    dismissResult();
    updatePreview();
  };
  els.reps[index] = input;
  return h('div', { class: 'set-row' },
    h('span', { class: `set-badge set-${index + 1}` }, `F${index + 1}`),
    h('button', { class: 'btn btn-ghost step-btn', type: 'button', 'aria-label': `Failure ${index + 1} minus one`, onClick: bump(-1) }, '-'),
    input,
    h('button', { class: 'btn btn-ghost step-btn', type: 'button', 'aria-label': `Failure ${index + 1} plus one`, onClick: bump(1) }, '+'));
}

function save(event) {
  event.preventDefault();
  const name = draft.name.trim();
  const session = currentSession();
  const problem = !name ? 'Enter an exercise name.' : validateSession(session);
  if (problem) {
    error = problem;
    render();
    return;
  }
  let exercise = program.findByName(name);
  if (!exercise) {
    const added = program.add({ name, weight: session.weight });
    if (!added.ok) {
      error = added.error;
      render();
      return;
    }
    exercise = added.exercise;
  }
  const previous = exercise.sessions.at(-1) ?? null;
  const trend = evaluate(exercise.sessions, session);
  const saved = program.logSession(exercise.id, session);
  error = saved ? '' : 'Storage error: data not saved.';
  result = { name: exercise.name, trend, session, previous, advice: weightAdvice(session.sets) };
  draft = blank();
  render();
  $('#result')?.scrollIntoView?.({ block: 'start' });
}

function logForm() {
  const exercises = program.all();
  els.last = h('p', { class: 'muted last-line' });
  els.preview = h('p', { class: 'preview' });
  els.advice = h('p', { class: 'advice' });
  els.error = h('p', { class: 'error', role: 'alert' }, error);

  const name = h('input', {
    name: 'exercise',
    type: 'text',
    list: 'exercise-names',
    maxlength: 40,
    autocomplete: 'off',
    autocapitalize: 'words',
    placeholder: 'e.g. Dumbbell press',
    value: draft.name,
    onInput: (event) => {
      draft.name = event.target.value;
      dismissResult();
      refreshContext();
    },
  });

  return h('form', { class: 'card log-form', novalidate: true, onSubmit: save },
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Exercise'), name),
    h('datalist', { id: 'exercise-names' }, ...exercises.map((exercise) => h('option', { value: exercise.name }))),
    exercises.length
      ? h('div', { class: 'chips', role: 'group', 'aria-label': 'Recent exercises' },
        ...recentExercises(exercises, 6).map((exercise) => h('button', {
          class: 'chip',
          type: 'button',
          'aria-pressed': String(exercise.name.toLowerCase() === draft.name.trim().toLowerCase()),
          onClick: () => pick(exercise),
        }, exercise.name)))
      : null,
    h('p', { class: 'muted' }, `Do 3 sets to failure at one weight. Aim for ${MIN_REPS}-${MAX_REPS} reps each.`),
    h('div', { class: 'sets' }, weightControl(), ...[0, 1, 2].map(repStepper)),
    els.preview,
    els.advice,
    els.error,
    h('button', { class: 'btn btn-big', type: 'submit' }, 'LOG IT'),
    els.last);
}

/* Result and journal */

function resultCard() {
  const { name, trend, session, previous, advice } = result;
  const load = volumeLoad(session);
  const delta = previous ? volumeDelta(volumeLoad(previous), load) : null;
  return h('section', { id: 'result', class: `card result result-${trend}`, role: 'status' },
    h('div', { class: 'result-top' }, badge(trend, 28), h('span', { class: 'ex-name' }, name)),
    h('p', { class: 'muted' }, TREND_MESSAGE[trend]),
    h('p', { class: 'result-numbers' },
      h('span', { class: 'big-number' }, weightText(load)),
      delta === null ? null : h('span', { class: 'delta' }, `${signed(delta)} vs last`)),
    h('p', { class: 'muted' }, `${weightText(session.weight)} x ${session.sets.join(' / ')}`),
    ADVICE_TEXT[advice] ? h('p', { class: 'advice' }, ADVICE_TEXT[advice]) : null);
}

function entryRow({ exercise, index, session, trend }) {
  return h('li', { class: 'entry' },
    h('span', { class: `entry-trend badge-${trend}`, title: TREND_LABEL[trend] },
      icon(TREND_ICON[trend], 20),
      h('span', { class: 'sr-only' }, TREND_LABEL[trend])),
    h('div', { class: 'entry-main' },
      h('p', { class: 'entry-name' }, exercise.name),
      h('p', { class: 'entry-sets' }, `${weightText(session.weight)} x ${session.sets.join(' / ')}`)),
    h('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': `Delete ${exercise.name} entry`,
      onClick: () => {
        if (!confirm(`Delete this ${exercise.name} entry?`)) return;
        program.removeSession(exercise.id, index);
        refresh();
      },
    }, icon('delete', 16)));
}

function journal() {
  const entries = journalEntries(program.all());
  if (!entries.length) {
    return h('section', { class: 'card empty' },
      icon('dumbbell', 48),
      h('h2', { class: 'empty-title' }, 'Your journal is empty'),
      h('p', { class: 'muted' }, 'Type an exercise above, enter the reps from your 3 failure sets, and tap LOG IT.'));
  }
  return h('section', { class: 'journal' },
    ...groupByDay(entries.slice(0, limit)).flatMap((group) => [
      h('h2', { class: 'day-head' }, dayLabel(group.day)),
      h('ul', { class: 'entries card' }, ...group.entries.map(entryRow)),
    ]),
    entries.length > limit
      ? h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => { limit += PAGE; render(); } }, 'SHOW MORE')
      : null);
}

export function render() {
  const goal = settings.get().goal;
  $('#tab-log').replaceChildren(
    viewTitle('JOURNAL'),
    goal
      ? h('button', { class: 'goal-line', type: 'button', onClick: openGoalDialog },
        h('span', { class: 'label' }, 'GOAL'),
        h('span', {}, goal))
      : null,
    result ? resultCard() : null,
    logForm(),
    journal());
  refreshContext();
}
