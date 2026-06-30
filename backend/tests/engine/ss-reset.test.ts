import { describe, it, expect, beforeEach } from 'vitest';
import { StartingStrengthEngine } from '../../src/engine/starting-strength/ss-engine';

describe('StartingStrengthEngine — reset logic', () => {
  let engine: StartingStrengthEngine;

  beforeEach(() => {
    engine = new StartingStrengthEngine();
  });

  const makeEx = (weight: number, failures = 3) => ({
    exerciseId: 'squat',
    exerciseName: 'Squat',
    currentWeight: weight,
    consecutiveFailures: failures,
    totalWorkouts: 10,
    lastWorkoutDate: new Date(),
  });

  it('reduces 100 kg by 10% to 90 kg', () => {
    const result = engine.calculateReset(makeEx(100));
    expect(result.resetWeight).toBe(90);
  });

  it('reduces 117.5 kg by 10% and floors to 105', () => {
    const result = engine.calculateReset(makeEx(117.5));
    // 117.5 * 0.9 = 105.75 → floor to 105
    expect(result.resetWeight).toBe(105);
  });

  it('reduces 150 kg by 10% to 135', () => {
    const result = engine.calculateReset(makeEx(150));
    // 150 * 0.9 = 135 (exact)
    expect(result.resetWeight).toBe(135);
  });

  it('reports percentReduction of 10', () => {
    const result = engine.calculateReset(makeEx(100));
    expect(result.percentReduction).toBe(10);
  });

  it('reports resetFromWeight correctly', () => {
    const result = engine.calculateReset(makeEx(100));
    expect(result.resetFromWeight).toBe(100);
  });

  it('reset weight is always lower than current weight', () => {
    [80, 100, 120, 145, 200].forEach((w) => {
      const result = engine.calculateReset(makeEx(w));
      expect(result.resetWeight).toBeLessThan(w);
    });
  });

  it('reset weight is aligned to 2.5 increment', () => {
    [80, 100, 120, 145, 200].forEach((w) => {
      const result = engine.calculateReset(makeEx(w));
      expect(result.resetWeight % 2.5).toBe(0);
    });
  });

  it('recordWorkoutResult applies reset after 3rd consecutive failure', () => {
    const state = {
      userId: 'u1',
      lastWorkoutType: 'B' as const,
      exercises: [{ ...makeEx(100, 2) }], // 2 failures, this workout = 3rd
      exerciseIdsByName: { Squat: 'squat' },
      settings: {
        units: 'KG' as const,
        alternateExercise: 'POWER_CLEAN' as const,
        increments: {},
        autoReduceDeadliftIncrement: false,
        restTimerSeconds: 180,
      },
    };
    const result = {
      sessionId: 's1',
      completedAt: new Date(),
      exercises: [
        {
          exerciseId: 'squat',
          sets: [
            { setNumber: 1, repsCompleted: 5, targetReps: 5, weight: 100 },
            { setNumber: 2, repsCompleted: 3, targetReps: 5, weight: 100 },
            { setNumber: 3, repsCompleted: 3, targetReps: 5, weight: 100 },
          ],
        },
      ],
    };
    const update = engine.recordWorkoutResult(state, result);
    const ex = update.exerciseUpdates[0];
    expect(ex.shouldReset).toBe(true);
    expect(ex.newWeight).toBe(90); // 100 * 0.9 = 90
    expect(ex.consecutiveFailures).toBe(0);
    expect(ex.resetFromWeight).toBe(100);
  });
});
