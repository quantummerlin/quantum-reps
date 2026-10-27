import { load, save } from './storage.js';
import { sanitizeSettings } from './schema.js';

export const events = new EventTarget();

function initial() {
  const stored = load('settings', null);
  if (stored) return sanitizeSettings(stored);
  // v0.1 kept unit and goal under their own keys.
  const goal = load('goal', '');
  return sanitizeSettings({ unit: load('unit', 'kg'), goal: goal === 'NO GOAL SET' ? '' : goal });
}

let current = initial();

export const get = () => current;

export function set(patch) {
  const prev = current;
  current = sanitizeSettings({ ...current, ...patch });
  const saved = save('settings', current);
  events.dispatchEvent(new CustomEvent('change', { detail: { prev, next: current } }));
  return saved;
}
