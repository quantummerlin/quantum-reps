import {
  TABLE_REPS, TARGET_CHIPS, epley1RM, maxForReps, nearestHalf, needsHeavierWeight, repTable, totalWeight,
  validateCalc, validateTarget,
} from '../modules/calc.js';
import { fromKg, toKg } from '../modules/units.js';
import { h } from '../modules/ui.js';
import { go } from '../nav.js';
import { prefillWeight } from './logView.js';
import { $, unit, viewTitle, weightText } from './shared.js';

const CUSTOM = 'custom';

// target is the rep count whose max is shown (1 is the classic one rep max).
// mode 'each' treats the entered weight as one dumbbell, with one in each hand.
const draft = { weightKg: null, reps: '', target: '1', custom: false, mode: 'total' };
const els = {};

const isEach = () => draft.mode === 'each';

function useWeight(kg) {
  prefillWeight(kg);
  go('log');
}

function targetRows(oneRM) {
  return repTable(oneRM).map(({ reps, weight }) => {
    const suggested = nearestHalf(weight, unit());
    return h('li', { class: 'rep-row' },
      h('span', { class: 'rep-count' }, `${reps} reps`),
      h('span', { class: 'rep-weight' }, weightText(suggested)),
      isEach() ? h('span', { class: 'rep-total' }, `${weightText(totalWeight(suggested, draft.mode))} total`) : null,
      h('button', {
        class: 'btn btn-small btn-ghost',
        type: 'button',
        'aria-label': `Use ${weightText(suggested)}${isEach() ? ' in each hand' : ''} for ${reps} reps in the journal`,
        onClick: () => useWeight(suggested),
      }, 'USE'));
  });
}

function showResult() {
  const input = { weight: draft.weightKg ?? 0, reps: draft.reps === '' ? 0 : Number(draft.reps) };
  const target = Number(draft.target);
  const targetProblem = validateTarget(target);
  const problem = validateCalc(input);
  const suffix = isEach() ? ' (EACH HAND)' : '';
  els.label.textContent = targetProblem ? `YOUR REP MAX${suffix}` : `YOUR ${target} REP MAX${suffix}`;
  els.targets.hidden = Boolean(problem);
  els.use.hidden = true;
  els.total.hidden = true;
  els.note.className = 'calc-note';

  if (problem || targetProblem) {
    els.value.replaceChildren(h('span', { class: 'calc-number calc-empty' }, '--'));
    els.advice.textContent = '';
    const started = draft.weightKg || draft.reps !== '';
    els.note.textContent = problem ? (started ? problem : 'Enter the weight you lifted and the reps you got.') : targetProblem;
    if (problem ? started : true) els.note.className = 'calc-note error';
    return;
  }

  const result = maxForReps(input.weight, input.reps, target);
  const suggested = nearestHalf(result, unit());
  els.value.replaceChildren(
    h('span', { class: 'calc-number' }, fromKg(result, unit())),
    h('span', { class: 'calc-unit' }, unit().toUpperCase()));
  els.total.hidden = !isEach();
  els.total.textContent = `Total ${weightText(totalWeight(result, draft.mode))}`;
  els.note.textContent = isEach()
    ? `Estimated from ${weightText(input.weight)} in each hand x ${input.reps}`
    : `Estimated from ${weightText(input.weight)} x ${input.reps}`;
  els.advice.textContent = needsHeavierWeight(input.reps)
    ? `${input.reps} reps, strong work. Move up a weight to keep progressing.`
    : '';
  els.use.hidden = false;
  els.use.textContent = `LOG WITH ${weightText(suggested)}${isEach() ? ' EACH HAND' : ''}`;
  els.use.onclick = () => useWeight(suggested);
  els.list.replaceChildren(...targetRows(epley1RM(input.weight, input.reps)));
}

function numberField(label, control) {
  return h('label', { class: 'calc-field' }, h('span', { class: 'field-label' }, label), control);
}

function targetPicker() {
  const select = h('select', {
    'aria-label': 'Show my max for',
    onChange: (event) => {
      draft.custom = event.target.value === CUSTOM;
      if (draft.custom) {
        els.targetInput.hidden = false;
        els.targetInput.focus();
        els.targetInput.select();
      } else {
        draft.target = event.target.value;
        els.targetInput.value = draft.target;
        els.targetInput.hidden = true;
      }
      showResult();
    },
  },
  ...TARGET_CHIPS.map((reps) => h('option', {
    value: reps,
    selected: !draft.custom && Number(draft.target) === reps,
  }, reps === 1 ? '1 rep max' : `${reps} rep max`)),
  h('option', { value: CUSTOM, selected: draft.custom }, 'Other number of reps...'));

  els.targetInput = h('input', {
    class: 'target-input',
    type: 'number',
    inputmode: 'numeric',
    min: 1,
    step: 1,
    placeholder: 'reps',
    value: draft.target,
    hidden: !draft.custom,
    'aria-label': 'Custom target reps',
    onInput: (event) => {
      draft.target = event.target.value;
      showResult();
    },
  });

  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, 'Show my max for'),
    h('div', { class: 'target-row' }, select, els.targetInput));
}

function modePicker() {
  const pick = (mode) => () => {
    if (draft.mode === mode) return;
    draft.mode = mode;
    render();
  };
  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, 'Weight type'),
    h('div', { class: 'segmented mode-toggle', role: 'group', 'aria-label': 'Weight type' },
      h('button', { class: 'seg-btn', type: 'button', 'aria-pressed': String(!isEach()), onClick: pick('total') }, 'TOTAL'),
      h('button', { class: 'seg-btn', type: 'button', 'aria-pressed': String(isEach()), onClick: pick('each') }, 'EACH HAND')),
    h('span', { class: 'hint' }, isEach()
      ? 'Dumbbells: enter the weight of one dumbbell. Results show each hand and the total.'
      : 'Enter the full weight lifted. Pick EACH HAND if you hold a dumbbell in each hand.'));
}

export function render() {
  const weight = h('input', {
    type: 'number',
    inputmode: 'decimal',
    min: 0,
    step: 0.5,
    placeholder: '0',
    value: draft.weightKg ? fromKg(draft.weightKg, unit()) : '',
    onInput: (event) => {
      const number = Number(event.target.value);
      draft.weightKg = event.target.value !== '' && Number.isFinite(number) && number > 0 ? toKg(number, unit()) : null;
      showResult();
    },
  });
  const reps = h('input', {
    type: 'number',
    inputmode: 'numeric',
    min: 1,
    step: 1,
    placeholder: '0',
    value: draft.reps,
    onInput: (event) => {
      draft.reps = event.target.value;
      showResult();
    },
  });

  els.label = h('p', { class: 'label' }, 'YOUR 1 REP MAX');
  els.value = h('p', { class: 'calc-value', role: 'status' });
  els.total = h('p', { class: 'calc-total', hidden: true });
  els.note = h('p', { class: 'calc-note' });
  els.advice = h('p', { class: 'advice calc-advice' });
  els.use = h('button', { class: 'btn btn-small btn-ghost calc-use', type: 'button', hidden: true });
  els.list = h('ul', { class: 'rep-table' });
  els.targets = h('details', { class: 'targets' },
    h('summary', {}, 'Weights for common rep targets'),
    h('p', { class: 'hint' }, `Targets for ${TABLE_REPS.join(', ')} reps. Tap USE to start a journal entry with that weight.`),
    els.list);

  $('#tab-calc').replaceChildren(
    viewTitle('REP MAX'),
    h('section', { class: 'card calc-card' },
      modePicker(),
      h('div', { class: 'calc-inputs' },
        numberField(isEach() ? `Weight per hand (${unit()})` : `Weight (${unit()})`, weight),
        numberField('Reps', reps)),
      targetPicker(),
      h('div', { class: 'calc-result' },
        els.label,
        els.value,
        els.total,
        els.note,
        els.advice,
        els.use)),
    els.targets,
    h('p', { class: 'hint calc-foot' }, 'Estimated with the Epley formula.'));
  showResult();
}
