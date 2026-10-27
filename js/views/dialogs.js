import * as program from '../modules/program.js';
import * as settings from '../modules/settings.js';
import { lineChart } from '../modules/chart.js';
import { bestVolume, volumeSeries } from '../modules/stats.js';
import { h } from '../modules/ui.js';
import { refresh } from '../nav.js';
import { $, weightText } from './shared.js';

let editingId = null;

export function openExerciseDialog(exercise) {
  editingId = exercise.id;
  const form = $('#exercise-form');
  form.elements.name.value = exercise.name;
  form.elements.bodyPart.value = exercise.bodyPart;
  form.elements.notes.value = exercise.notes;
  form.elements.contraction.value = exercise.technique.contraction;
  form.elements.stretch.value = exercise.technique.stretch;
  $('#technique').open = Boolean(exercise.technique.contraction || exercise.technique.stretch);

  const series = volumeSeries(exercise);
  $('#exercise-chart').replaceChildren(series.length > 1
    ? lineChart(series.slice(-20), { label: `${exercise.name} volume per session` })
    : h('p', { class: 'muted' }, 'Log this exercise at least twice to see a chart.'));
  $('#exercise-stats').textContent = series.length
    ? `${series.length} session${series.length === 1 ? '' : 's'}. Best volume ${weightText(bestVolume(exercise))}.`
    : 'No sessions logged yet.';
  $('#exercise-error').textContent = '';
  $('#exercise-dialog').showModal();
}

export function openGoalDialog() {
  const dialog = $('#goal-dialog');
  $('#goal-input').value = settings.get().goal;
  dialog.returnValue = '';
  dialog.showModal();
}

export function initDialogs(bodyParts) {
  const form = $('#exercise-form');
  for (const part of bodyParts) {
    form.elements.bodyPart.append(h('option', { value: part }, part));
  }

  $('#exercise-cancel').addEventListener('click', () => $('#exercise-dialog').close());

  $('#exercise-delete').addEventListener('click', () => {
    const exercise = program.get(editingId);
    if (!exercise || !confirm(`Delete ${exercise.name} and all of its entries?`)) return;
    program.remove(editingId);
    $('#exercise-dialog').close();
    refresh();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = program.update(editingId, {
      name: form.elements.name.value,
      bodyPart: form.elements.bodyPart.value,
      notes: form.elements.notes.value,
      technique: { contraction: form.elements.contraction.value, stretch: form.elements.stretch.value },
    });
    $('#exercise-error').textContent = result.ok ? '' : result.error;
    if (!result.ok) return;
    $('#exercise-dialog').close();
    refresh();
  });

  const goalDialog = $('#goal-dialog');
  goalDialog.addEventListener('close', () => {
    if (goalDialog.returnValue === 'save') settings.set({ goal: $('#goal-input').value });
  });
}
