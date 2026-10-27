export const TABS = ['log', 'exercises', 'calc', 'more'];

const views = new Map();
let active = 'log';

export const register = (name, view) => views.set(name, view);

export const refresh = () => views.get(active)?.render();

export function go(name) {
  active = name;
  for (const button of document.querySelectorAll('.nav-btn')) {
    if (button.dataset.tab === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  for (const tab of TABS) document.getElementById(`tab-${tab}`).hidden = tab !== name;
  window.scrollTo({ top: 0 });
  views.get(name)?.render();
}
