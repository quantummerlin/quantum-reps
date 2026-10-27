import * as program from '../modules/program.js';
import * as protein from '../modules/protein.js';
import * as settings from '../modules/settings.js';
import { MAX_BACKUP_BYTES, buildBackup, parseBackup } from '../modules/backup.js';
import { DEFAULT_SETTINGS } from '../modules/schema.js';
import { h } from '../modules/ui.js';
import { refresh } from '../nav.js';
import { openGoalDialog } from './dialogs.js';
import { $, viewTitle } from './shared.js';

const VERSION = '0.3';
let status = '';

const section = (title, ...children) => h('section', { class: 'card' }, h('h2', { class: 'label' }, title), ...children);

function say(message) {
  status = message;
  refresh();
}

function exportBackup() {
  const backup = buildBackup({
    exercises: program.all(),
    settings: settings.get(),
    protein: protein.snapshot(),
  });
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = h('a', { href: url, download: `quantum-reps-${protein.localDay()}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say('Backup downloaded.');
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    say('That file is too large to be a backup.');
    return;
  }
  const parsed = parseBackup(await file.text());
  if (!parsed.ok) {
    say(parsed.error);
    return;
  }
  const { exercises, settings: imported, protein: importedProtein } = parsed.data;
  if (!confirm(`Replace all current data with ${exercises.length} exercise(s) from this backup?`)) return;
  program.replaceAll(exercises);
  protein.replace(importedProtein);
  status = 'Backup restored.';
  settings.set(imported);
}

function resetAll() {
  if (!confirm('Erase all exercises, entries and settings from this device?')) return;
  program.replaceAll([]);
  protein.replace(null);
  status = 'All data erased.';
  settings.set(DEFAULT_SETTINGS);
}

export function render() {
  const { goal } = settings.get();
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'sr-only',
    id: 'import-file',
    tabindex: -1,
    onChange: (event) => importBackup(event.target.files[0]),
  });

  $('#tab-more').replaceChildren(
    viewTitle('MORE'),
    section('GOAL',
      h('p', { class: 'hero-goal' }, goal || 'No goal set.'),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onClick: openGoalDialog }, goal ? 'EDIT GOAL' : 'SET GOAL')),
    section('HOW IT WORKS',
      h('ol', { class: 'steps' },
        h('li', {}, h('strong', {}, 'Pick one weight. '), 'Choose a load where you fail somewhere between 8 and 30 reps.'),
        h('li', {}, h('strong', {}, 'Fail three times. '), 'Do 3 sets to failure at that same weight.'),
        h('li', {}, h('strong', {}, 'Log F1, F2, F3. '), 'Beat last session\'s volume (weight x total reps) to earn the trophy.'),
        h('li', {}, h('strong', {}, 'Eat. '), 'Aim for 135 to 170 g of protein a day. Tap +25 at the top as you go.'))),
    section('YOUR DATA',
      h('p', { class: 'muted' }, 'Everything lives on this device only. Export a backup before clearing your browser data or switching phones.'),
      h('div', { class: 'card-actions' },
        h('button', { class: 'btn btn-small', type: 'button', onClick: exportBackup }, 'EXPORT BACKUP'),
        h('button', { class: 'btn btn-small btn-ghost', type: 'button', onClick: () => fileInput.click() }, 'IMPORT BACKUP'),
        h('button', { class: 'btn btn-small btn-danger', type: 'button', onClick: resetAll }, 'ERASE ALL')),
      fileInput,
      h('p', { class: 'status', role: 'status' }, status)),
    h('p', { class: 'muted about' }, `Quantum Reps v${VERSION}. No account, no tracking, no network calls.`));
}
