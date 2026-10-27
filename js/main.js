import * as protein from './modules/protein.js';
import * as settings from './modules/settings.js';
import { BODY_PARTS } from './modules/program.js';
import { icon } from './modules/ui.js';
import { TABS, go, refresh, register } from './nav.js';
import { initDialogs } from './views/dialogs.js';
import * as logView from './views/logView.js';
import * as exercisesView from './views/exercisesView.js';
import * as calcView from './views/calcView.js';
import * as moreView from './views/moreView.js';

const $ = (selector) => document.querySelector(selector);

const NAV_ICONS = {
  log: 'dumbbell', exercises: 'program', calc: 'calc', more: 'settings',
};

function renderHeader() {
  const { unit } = settings.get();
  for (const button of document.querySelectorAll('.topbar .seg-btn')) {
    button.setAttribute('aria-pressed', String(button.dataset.unit === unit));
  }
  const count = protein.todayCount();
  $('#protein-count').textContent = count;
  $('#protein-progress').value = Math.min(count, protein.TARGET.min);
  $('.protein-bar').dataset.level = protein.proteinLevel(count);
  $('#protein-status').textContent = `Protein ${count} grams, ${protein.proteinStatus(count).toLowerCase()}`;
}

function changeProtein(delta) {
  if (!protein.change(delta)) {
    $('#protein-status').textContent = 'Storage error: protein not saved.';
    return;
  }
  renderHeader();
}

function init() {
  register('log', logView);
  register('exercises', exercisesView);
  register('calc', calcView);
  register('more', moreView);

  $('#brand-mark').append(icon('dumbbell', 28));
  for (const button of document.querySelectorAll('.nav-btn')) {
    button.querySelector('.nav-icon').append(icon(NAV_ICONS[button.dataset.tab], 24));
    button.addEventListener('click', () => go(button.dataset.tab));
  }
  if (TABS.length !== document.querySelectorAll('.nav-btn').length) throw new Error('Nav and tab list are out of sync');

  for (const button of document.querySelectorAll('.topbar .seg-btn')) {
    button.addEventListener('click', () => settings.set({ unit: button.dataset.unit }));
  }
  $('#protein-add').addEventListener('click', () => changeProtein(protein.STEP));
  $('#protein-undo').addEventListener('click', () => changeProtein(-protein.STEP));
  document.addEventListener('visibilitychange', renderHeader);

  settings.events.addEventListener('change', () => {
    renderHeader();
    refresh();
  });

  initDialogs(BODY_PARTS);
  renderHeader();
  go('log');
}

init();
