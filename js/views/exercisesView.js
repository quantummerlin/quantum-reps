import * as program from '../modules/program.js';
import { lineChart } from '../modules/chart.js';
import { recentExercises } from '../modules/journal.js';
import { latestTrend } from '../modules/progress.js';
import { volumeSeries } from '../modules/stats.js';
import { h } from '../modules/ui.js';
import { go } from '../nav.js';
import { openExerciseDialog } from './dialogs.js';
import { $, badge, viewTitle, weightText } from './shared.js';

function card(exercise) {
  const trend = latestTrend(exercise.sessions);
  const last = exercise.sessions.at(-1);
  const series = volumeSeries(exercise).slice(-12);
  return h('button', {
    class: 'card ex-card',
    type: 'button',
    'aria-label': `Open ${exercise.name}`,
    onClick: () => openExerciseDialog(exercise),
  },
  h('div', { class: 'ex-head' },
    h('div', {},
      h('span', { class: 'ex-name' }, exercise.name),
      exercise.bodyPart === 'OTHER' ? null : h('span', { class: 'tag' }, exercise.bodyPart)),
    trend ? badge(trend) : null),
  h('div', { class: 'ex-body' },
    h('p', { class: 'muted' }, last ? `${weightText(last.weight)} x ${last.sets.join(' / ')}` : 'No sessions yet.'),
    series.length > 1
      ? lineChart(series, { width: 120, height: 40, dots: false, label: `${exercise.name} volume trend` })
      : null),
  exercise.notes ? h('p', { class: 'notes' }, exercise.notes) : null);
}

export function render() {
  const list = program.all();
  $('#tab-exercises').replaceChildren(
    viewTitle('EXERCISES'),
    list.length
      ? h('div', { class: 'card-list' }, ...recentExercises(list, list.length).map(card))
      : h('section', { class: 'card empty' },
        h('h2', { class: 'empty-title' }, 'No exercises yet'),
        h('p', { class: 'muted' }, 'Exercises appear here as soon as you log them in your journal.'),
        h('button', { class: 'btn', type: 'button', onClick: () => go('log') }, 'GO TO JOURNAL')));
}
