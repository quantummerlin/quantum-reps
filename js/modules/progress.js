import { volumeLoad } from './logger.js';

export const TREND_LABEL = {
  baseline: 'BASELINE SET',
  record: 'NEW RECORD',
  improved: 'IMPROVED',
  same: 'NO CHANGE',
  regressed: 'REGRESSED',
};

export const TREND_ICON = {
  baseline: 'baseline',
  record: 'trophy',
  improved: 'up',
  same: 'same',
  regressed: 'warn',
};

export const TREND_MESSAGE = {
  baseline: 'Baseline set. Beat it next time.',
  record: 'New record. Your best volume yet.',
  improved: 'More volume than last time.',
  same: 'Same as last time. Find one more rep.',
  regressed: 'Down from last time. Rest, eat, go again.',
};

// Percent change in volume, or null when there is nothing to compare against.
export function volumeDelta(previousLoad, load) {
  return previousLoad > 0 ? Math.round(((load - previousLoad) / previousLoad) * 100) : null;
}

// `history` holds earlier sessions only; the session being judged is excluded.
export function evaluate(history, session) {
  if (!history.length) return 'baseline';
  const load = volumeLoad(session);
  const previous = volumeLoad(history[history.length - 1]);
  if (load < previous) return 'regressed';
  if (load === previous) return 'same';
  const best = Math.max(...history.map(volumeLoad));
  return load > best ? 'record' : 'improved';
}

export function latestTrend(sessions) {
  if (!sessions.length) return null;
  return evaluate(sessions.slice(0, -1), sessions[sessions.length - 1]);
}
