import { MAX_WEIGHT } from './logger.js';
import { fromKg, toKg } from './units.js';

export const MAX_CALC_REPS = 30;
export const TABLE_REPS = [5, 8, 10, 12, 15, 20, 25, 30];

export const epley1RM = (weight, reps) => (reps === 1 ? weight : weight * (1 + reps / 30));

export const weightForReps = (oneRM, reps) => (reps === 1 ? oneRM : oneRM / (1 + reps / 30));

export const repTable = (oneRM, repsList = TABLE_REPS) => repsList.map((reps) => ({
  reps,
  weight: weightForReps(oneRM, reps),
}));

export function validateCalc({ weight, reps }) {
  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
    return `Enter a weight above 0 (max ${MAX_WEIGHT} kg).`;
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > MAX_CALC_REPS) {
    return `Enter reps between 1 and ${MAX_CALC_REPS}.`;
  }
  return null;
}

// Dumbbells and plates come in small steps, so suggestions snap to the nearest 0.5 in the shown unit.
export const nearestHalf = (kg, unit) => toKg(Math.round(fromKg(kg, unit) * 2) / 2, unit);
