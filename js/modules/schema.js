import { MAX_ENTRY, MAX_WEIGHT, SETS_PER_EXERCISE } from './logger.js';
import { UNITS } from './units.js';

export const BODY_PARTS = ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE', 'OTHER'];
export const DEFAULT_SETTINGS = { unit: 'kg', goal: '' };

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isWeight = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= MAX_WEIGHT;

export function sanitizeSession(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const sets = Array.isArray(raw.sets) ? raw.sets : [];
  const valid = isWeight(raw.weight)
    && sets.length === SETS_PER_EXERCISE
    && sets.every((reps) => Number.isInteger(reps) && reps >= 1 && reps <= MAX_ENTRY)
    && typeof raw.date === 'string'
    && !Number.isNaN(Date.parse(raw.date));
  return valid ? { date: raw.date, weight: raw.weight, sets: [...sets] } : null;
}

export function sanitizeExercise(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = text(raw.id, 64);
  const name = text(raw.name, 40);
  if (!id || !name || !isWeight(raw.weight)) return null;
  const technique = raw.technique && typeof raw.technique === 'object' ? raw.technique : {};
  return {
    id,
    name,
    bodyPart: BODY_PARTS.includes(raw.bodyPart) ? raw.bodyPart : 'OTHER',
    weight: raw.weight,
    notes: text(raw.notes, 500),
    technique: { contraction: text(technique.contraction, 140), stretch: text(technique.stretch, 140) },
    sessions: (Array.isArray(raw.sessions) ? raw.sessions : []).map(sanitizeSession).filter(Boolean),
  };
}

export function sanitizeExercises(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map(sanitizeExercise)
    .filter((exercise) => exercise && !seen.has(exercise.id) && seen.add(exercise.id));
}

export function sanitizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    unit: UNITS.includes(source.unit) ? source.unit : DEFAULT_SETTINGS.unit,
    goal: text(source.goal, 140),
  };
}

export function sanitizeProtein(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(raw.date) && Number.isInteger(raw.count) && raw.count >= 0 && raw.count <= 5000;
  return valid ? { date: raw.date, count: raw.count } : null;
}
