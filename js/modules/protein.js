import { load, save } from './storage.js';
import { sanitizeProtein } from './schema.js';
import { localDay } from './dates.js';

export { localDay };
export const TARGET = { min: 135, max: 170 };
export const STEP = 25;

// Stored shape is { date, count }; a count from an earlier day reads as 0.
export function currentCount(stored, day) {
  return stored && stored.date === day ? stored.count : 0;
}

export function addProtein(stored, day, delta) {
  return { date: day, count: Math.max(0, currentCount(stored, day) + delta) };
}

export function proteinLevel(count) {
  if (count < TARGET.min) return 'below';
  if (count <= TARGET.max) return 'on';
  return 'over';
}

const STATUS_TEXT = { below: 'BELOW TARGET', on: 'ON TARGET', over: 'OVER TARGET' };

export const proteinStatus = (count) => STATUS_TEXT[proteinLevel(count)];

let stored = sanitizeProtein(load('protein', null));

export const snapshot = () => stored;

export const todayCount = (day = localDay()) => currentCount(stored, day);

export function change(delta, day = localDay()) {
  stored = addProtein(stored, day, delta);
  return save('protein', stored);
}

export function replace(raw) {
  stored = sanitizeProtein(raw);
  return save('protein', stored);
}
