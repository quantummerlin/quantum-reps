import { load, save } from './storage.js';
import { MAX_WEIGHT } from './logger.js';
import { BODY_PARTS, sanitizeExercises } from './schema.js';

export { BODY_PARTS };

const STORAGE_ERROR = 'Storage error: data not saved.';

const exercises = sanitizeExercises(load('exercises', []));

const persist = () => save('exercises', exercises);

// randomUUID needs a secure context, which a phone on a LAN address is not.
const newId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const all = () => exercises;

export const get = (id) => exercises.find((exercise) => exercise.id === id);

export const findByName = (name) => exercises.find((exercise) => sameName(exercise.name, String(name ?? '')));

function checkName(name, ownId = null) {
  if (!name) return 'Enter an exercise name.';
  if (name.length > 40) return 'Keep the name to 40 characters.';
  const clash = findByName(name);
  return clash && clash.id !== ownId ? 'You already have an exercise with that name.' : null;
}

const cleanBodyPart = (bodyPart) => (BODY_PARTS.includes(bodyPart) ? bodyPart : 'OTHER');

export function add({ name, bodyPart, weight }) {
  const trimmed = String(name ?? '').trim();
  const error = checkName(trimmed)
    ?? (weight > 0 && weight <= MAX_WEIGHT ? null : `Enter a weight above 0 (max ${MAX_WEIGHT} kg).`);
  if (error) return { ok: false, error };
  const exercise = {
    id: newId(),
    name: trimmed,
    bodyPart: cleanBodyPart(bodyPart),
    weight,
    notes: '',
    technique: { contraction: '', stretch: '' },
    sessions: [],
  };
  exercises.push(exercise);
  return persist() ? { ok: true, exercise } : { ok: false, error: STORAGE_ERROR };
}

export function update(id, { name, bodyPart, notes, technique }) {
  const exercise = get(id);
  if (!exercise) return { ok: false, error: 'That exercise no longer exists.' };
  const trimmed = String(name ?? '').trim();
  const error = checkName(trimmed, id);
  if (error) return { ok: false, error };
  Object.assign(exercise, {
    name: trimmed,
    bodyPart: cleanBodyPart(bodyPart),
    notes: String(notes ?? '').trim().slice(0, 500),
    technique: {
      contraction: String(technique?.contraction ?? '').trim().slice(0, 140),
      stretch: String(technique?.stretch ?? '').trim().slice(0, 140),
    },
  });
  return persist() ? { ok: true, exercise } : { ok: false, error: STORAGE_ERROR };
}

export function remove(id) {
  const index = exercises.findIndex((exercise) => exercise.id === id);
  if (index === -1) return false;
  exercises.splice(index, 1);
  return persist();
}

export function logSession(id, session) {
  const exercise = get(id);
  if (!exercise) return false;
  exercise.sessions.push(session);
  exercise.weight = session.weight;
  return persist();
}

export function removeSession(id, index) {
  const exercise = get(id);
  if (!exercise || !exercise.sessions[index]) return false;
  exercise.sessions.splice(index, 1);
  const last = exercise.sessions[exercise.sessions.length - 1];
  if (last) exercise.weight = last.weight;
  return persist();
}

export function replaceAll(list) {
  exercises.splice(0, exercises.length, ...sanitizeExercises(list));
  return persist();
}
