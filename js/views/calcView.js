import {
  TABLE_REPS, TARGET_CHIPS, epley1RM, maxForReps, nearestHalf, needsHeavierWeight, repTable, validateCalc, validateTarget,
} from '../modules/calc.js';
import { fromKg, toKg } from '../modules/units.js';
import { h } from '../modules/ui.js';
import { go } from '../nav.js';
import { prefillWeight } from './logView.js';
import { $, unit, viewTitle, weightText } from './shared.js';

// target is the rep count whose max is shown; 1 gives the classic one rep max.
const draft = { weightKg: null, reps: '', target: '1' };
const els = { chips: [] };

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
      h('button', {
        class: 'btn btn-small btn-ghost',
        type: 'button',
        'aria-label': `Use ${weightText(suggested)} for ${reps} reps in the journal`,
        onClick: () => useWeight(suggested),
      }, 'USE'));
  });
}

function updateChips() {
  const target = Number(draft.target);
  els.chips.forEach((chip) => chip.setAttribute('aria-pressed', String(Number(chip.dataset.reps) === target)));
}

function showResult() {
  const input = { weight: draft.weightKg ?? 0, reps: draft.reps === '' ? 0 : Number(draft.reps) };
  const target = Number(draft.target);
  const targetProblem = validateTarget(target);
  const problem = validateCalc(input);
  els.label.textContent = targetProblem ? 'YOUR REP MAX' : `YOUR ${target} REP MAX`;
  els.targets.hidden = Boolean(problem);
  els.use.hidden = true;
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
  els.note.textContent = `Estimated from ${weightText(input.weight)} x ${input.reps}`;
  els.advice.textContent = needsHeavierWeight(input.reps)
    ? `${input.reps} reps, strong work. Move up a weight to keep progressing.`
    : '';
  els.use.hidden = false;
  els.use.textContent = `LOG WITH ${weightText(suggested)}`;
  els.use.onclick = () => useWeight(suggested);
  els.list.replaceChildren(...targetRows(epley1RM(input.weight, input.reps)));
}

function numberField(label, control) {
  return h('label', { class: 'calc-field' }, h('span', { class: 'field-label' }, label), control);
}

function setTarget(value) {
  draft.target = String(value);
  els.targetInput.value = draft.target;
  updateChips();
  showResult();
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

  els.targetInput = h('input', {
    class: 'target-input',
    type: 'number',
    inputmode: 'numeric',
    min: 1,
    step: 1,
    value: draft.target,
    'aria-label': 'Target reps',
    onInput: (event) => {
      draft.target = event.target.value;
      updateChips();
      showResult();
    },
  });
  els.chips = TARGET_CHIPS.map((reps) => h('button', {
    class: 'chip',
    type: 'button',
    'data-reps': reps,
    onClick: () => setTarget(reps),
  }, String(reps)));

  els.label = h('p', { class: 'label' }, 'YOUR 1 REP MAX');
  els.value = h('p', { class: 'calc-value', role: 'status' });
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
      h('div', { class: 'calc-inputs' },
        numberField(`Weight (${unit()})`, weight),
        numberField('Reps', reps)),
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, 'Show my max for'),
        h('div', { class: 'target-row' },
          h('div', { class: 'chips target-chips', role: 'group', 'aria-label': 'Target reps' }, ...els.chips),
          els.targetInput)),
      h('div', { class: 'calc-result' },
        els.label,
        els.value,
        els.note,
        els.advice,
        els.use)),
    els.targets,
    h('p', { class: 'hint calc-foot' }, 'Estimated with the Epley formula.'));
  updateChips();
  showResult();
}
