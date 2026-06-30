import type { SetResult } from '../engine.types';

/**
 * Epley formula: weight × (1 + reps/30). Returns weight unchanged for 1 rep.
 */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Round to nearest barbell-loadable increment (default 2.5 kg).
 */
export function roundToIncrement(weight: number, increment: number = 2.5): number {
  if (increment === 0) return weight;
  return Math.round(weight / increment) * increment;
}

/**
 * Floor to nearest increment (ensures we don't go over target on reset).
 */
export function floorToIncrement(weight: number, increment: number = 2.5): number {
  if (increment === 0) return weight;
  return Math.floor(weight / increment) * increment;
}

/**
 * Calculate reset weight: reduce by percentage, floor to increment.
 */
export function calculateResetWeight(
  currentWeight: number,
  reductionPct: number = 0.10,
  increment: number = 2.5,
): number {
  const raw = currentWeight * (1 - reductionPct);
  return floorToIncrement(raw, increment);
}

/**
 * Returns true if every set completed the target reps.
 */
export function isFullSuccess(sets: SetResult[], targetReps: number): boolean {
  return sets.length > 0 && sets.every((s) => s.repsCompleted >= targetReps);
}

/**
 * Total training volume across all sets: sum(weight × reps).
 */
export function totalVolume(sets: SetResult[]): number {
  return sets.reduce((acc, s) => acc + s.weight * s.repsCompleted, 0);
}

/**
 * Best single-set estimated 1RM from an array of sets.
 */
export function best1RM(sets: SetResult[]): number {
  return sets.reduce((best, s) => {
    const e1rm = epley1RM(s.weight, s.repsCompleted);
    return e1rm > best ? e1rm : best;
  }, 0);
}
