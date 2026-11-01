import { TABLE_REPS, epley1RM, nearestHalf, needsHeavierWeight, repTable, validateCalc } from '../modules/calc.js';
import { fromKg, toKg } from '../modules/units.js';
import { h } from '../modules/ui.js';
import { go } from '../nav.js';
import { prefillWeight } from './logView.js';
import { $, unit, viewTitle, weightText } from './shared.js';

const draft = { weightKg: null, reps: '' };
const els = {};

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
        onClick: () => {
          prefillWeight(suggested);
          go('log');
        },
      }, 'USE'));
  });
}

function showResult() {
  const input = { weight: draft.weightKg ?? 0, reps: draft.reps === '' ? 0 : Number(draft.reps) };
  const problem = validateCalc(input);
  els.targets.hidden = Boolean(problem);
  els.note.className = 'calc-note';

  if (problem) {
    els.value.replaceChildren(h('span', { class: 'calc-number calc-empty' }, '--'));
    els.advice.textContent = '';
    const started = draft.weightKg || draft.reps !== '';
    els.note.textContent = started ? problem : 'Enter the weight you lifted and the reps you got.';
    if (started) els.note.className = 'calc-note error';
    return;
  }

  const oneRM = epley1RM(input.weight, input.reps);
  els.value.replaceChildren(
    h('span', { class: 'calc-number' }, fromKg(oneRM, unit())),
    h('span', { class: 'calc-unit' }, unit().toUpperCase()));
  els.note.textContent = `Estimated from ${weightText(input.weight)} x ${input.reps}`;
  els.advice.textContent = needsHeavierWeight(input.reps)
    ? `${input.reps} reps is past the useful range. Move up a weight and test again for a more accurate max.`
    : '';
  els.list.replaceChildren(...targetRows(oneRM));
}

function numberField(label, control) {
  return h('label', { class: 'calc-field' }, h('span', { class: 'field-label' }, label), control);
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

  els.value = h('p', { class: 'calc-value', role: 'status' });
  els.note = h('p', { class: 'calc-note' });
  els.advice = h('p', { class: 'advice calc-advice' });
  els.list = h('ul', { class: 'rep-table' });
  els.targets = h('details', { class: 'targets' },
    h('summary', {}, 'Weights for other rep targets'),
    h('p', { class: 'hint' }, `Targets for ${TABLE_REPS.join(', ')} reps. Tap USE to start a journal entry with that weight.`),
    els.list);

  $('#tab-calc').replaceChildren(
    viewTitle('1 REP MAX'),
    h('section', { class: 'card calc-card' },
      h('div', { class: 'calc-inputs' },
        numberField(`Weight (${unit()})`, weight),
        numberField('Reps', reps)),
      h('div', { class: 'calc-result' },
        h('p', { class: 'label' }, 'YOUR 1 REP MAX'),
        els.value,
        els.note,
        els.advice)),
    els.targets,
    h('p', { class: 'hint calc-foot' }, 'Epley formula. Most accurate under 12 reps and rougher beyond that.'));
  showResult();
}
