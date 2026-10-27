import * as settings from '../modules/settings.js';
import { TREND_ICON, TREND_LABEL } from '../modules/progress.js';
import { formatWeight } from '../modules/units.js';
import { h, icon } from '../modules/ui.js';

export const $ = (selector) => document.querySelector(selector);

export const unit = () => settings.get().unit;

export const weightText = (kg) => formatWeight(kg, unit());

export function badge(trend, px = 20) {
  return h('span', { class: `badge badge-${trend}` }, icon(TREND_ICON[trend], px), TREND_LABEL[trend]);
}

export function viewTitle(text) {
  return h('div', { class: 'view-head' }, h('h1', { class: 'view-title' }, text));
}
