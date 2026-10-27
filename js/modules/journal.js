import { localDay } from './dates.js';
import { evaluate } from './progress.js';

// Flattens every exercise's sessions into one newest-first journal.
export function journalEntries(exercises) {
  const entries = [];
  for (const exercise of exercises) {
    exercise.sessions.forEach((session, index) => {
      entries.push({
        exercise,
        index,
        session,
        trend: evaluate(exercise.sessions.slice(0, index), session),
        day: localDay(new Date(session.date)),
      });
    });
  }
  return entries.sort((a, b) => Date.parse(b.session.date) - Date.parse(a.session.date) || b.index - a.index);
}

export function groupByDay(entries) {
  const groups = [];
  for (const entry of entries) {
    const group = groups[groups.length - 1];
    if (group && group.day === entry.day) group.entries.push(entry);
    else groups.push({ day: entry.day, entries: [entry] });
  }
  return groups;
}

export function dayLabel(day, today = localDay()) {
  const [ty, tm, td] = today.split('-').map(Number);
  if (day === today) return 'Today';
  if (day === localDay(new Date(ty, tm - 1, td - 1))) return 'Yesterday';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Exercises trained most recently first; never-trained ones follow in their saved order.
export function recentExercises(exercises, limit) {
  const lastDate = (exercise) => {
    const last = exercise.sessions[exercise.sessions.length - 1];
    return last ? Date.parse(last.date) : -Infinity;
  };
  return exercises
    .map((exercise, order) => ({ exercise, order, at: lastDate(exercise) }))
    .sort((a, b) => b.at - a.at || a.order - b.order)
    .slice(0, limit)
    .map((item) => item.exercise);
}
