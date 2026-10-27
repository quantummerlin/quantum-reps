import { sanitizeExercises, sanitizeProtein, sanitizeSettings } from './schema.js';

export const BACKUP_APP = 'quantum-reps';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5_000_000;

export function buildBackup({ exercises, settings, protein }) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    settings,
    protein,
  };
}

// Imported files are untrusted, so every field goes through the same sanitizers as stored data.
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > MAX_BACKUP_BYTES) {
    return { ok: false, error: 'That file is too large to be a backup.' };
  }
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!raw || raw.app !== BACKUP_APP || raw.version !== BACKUP_VERSION || !Array.isArray(raw.exercises)) {
    return { ok: false, error: 'That file is not a Quantum Reps backup.' };
  }
  return {
    ok: true,
    data: {
      exercises: sanitizeExercises(raw.exercises),
      settings: sanitizeSettings(raw.settings),
      protein: sanitizeProtein(raw.protein),
    },
  };
}
