export const SETS_PER_EXERCISE = 3;
export const MIN_REPS = 8;
export const MAX_REPS = 30;
export const MAX_ENTRY = 99;
export const MAX_WEIGHT = 1000;

export const ADVICE_TEXT = {
  heavy: 'Too heavy: drop the weight next time.',
  light: 'Too light: add weight next time.',
  ok: '',
};

export function volumeLoad(session) {
  return session.weight * session.sets.reduce((sum, reps) => sum + reps, 0);
}

export function validateSession(session) {
  const { weight, sets } = session;
  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
    return `Enter a weight above 0 (max ${MAX_WEIGHT} kg).`;
  }
  const valid = Array.isArray(sets)
    && sets.length === SETS_PER_EXERCISE
    && sets.every((reps) => Number.isInteger(reps) && reps >= 1 && reps <= MAX_ENTRY);
  return valid ? null : `Enter reps for all ${SETS_PER_EXERCISE} failures (1-${MAX_ENTRY}).`;
}

export function weightAdvice(sets) {
  if (sets[0] < MIN_REPS) return 'heavy';
  if (sets[sets.length - 1] >= MAX_REPS) return 'light';
  return 'ok';
}
