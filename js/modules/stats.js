import { volumeLoad } from './logger.js';

export const volumeSeries = (exercise) => exercise.sessions.map(volumeLoad);

export function bestVolume(exercise) {
  const series = volumeSeries(exercise);
  return series.length ? Math.max(...series) : 0;
}
