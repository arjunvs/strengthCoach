import { describe, it, expect, beforeEach } from 'vitest';
import { StartingStrengthEngine } from '../../src/engine/starting-strength/ss-engine';
import type { ProgramState, WorkoutResult } from '../../src/engine/engine.types';

const BASE_SETTINGS = {
  units: 'KG' as const,
  alternateExercise: 'POWER_CLEAN' as const,
  increments: {},
  autoReduceDeadliftIncrement: false,
  restTimerSeconds: 180,
};

function makeState(consecutiveFailures: number): ProgramState {
  return {
    userId: 'u1',
    lastWorkoutType: 'B',
    exercises: [
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        currentWeight: 100,
        consecutiveFailures,
        totalWorkouts: 5,
        lastWorkoutDate: new Date(),
      },
    ],
    exerciseIdsByName: { Squat: 'squat' },
    settings: BASE_SETTINGS,
  };
}

function makeResult(repsPerSet: number[], weight = 100): WorkoutResult {
  return {
    sessionId: 's1',
    completedAt: new Date(),
    exercises: [
      {
        exerciseId: 'squat',
        sets: repsPerSet.map((reps, i) => ({
          setNumber: i + 1,
          repsCompleted: reps,
          targetReps: 5,
          weight,
        })),
      },
    ],
  };
}

describe('StartingStrengthEngine — failure counting', () => {
  let engine: StartingStrengthEngine;

  beforeEach(() => {
    engine = new StartingStrengthEngine();
  });

  it('resets failure count to 0 on full success', () => {
    const state = makeState(2);
    const result = makeResult([5, 5, 5]);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].consecutiveFailures).toBe(0);
    expect(update.exerciseUpdates[0].success).toBe(true);
  });

  it('increments failure count from 0 to 1 on first failure', () => {
    const state = makeState(0);
    const result = makeResult([5, 5, 4]); // last set short
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].consecutiveFailures).toBe(1);
    expect(update.exerciseUpdates[0].success).toBe(false);
  });

  it('increments failure count from 1 to 2 on second consecutive failure', () => {
    const state = makeState(1);
    const result = makeResult([5, 4, 4]);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].consecutiveFailures).toBe(2);
  });

  it('holds weight (no increment) on failure', () => {
    const state = makeState(0);
    const result = makeResult([5, 5, 4]);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].newWeight).toBe(100);
    expect(update.exerciseUpdates[0].incrementApplied).toBe(0);
  });

  it('triggers reset on 3rd consecutive failure', () => {
    const state = makeState(2);
    const result = makeResult([5, 4, 4]); // 3rd consecutive
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].shouldReset).toBe(true);
    expect(update.exerciseUpdates[0].consecutiveFailures).toBe(0); // reset clears counter
  });

  it('does NOT trigger reset on 2nd consecutive failure', () => {
    const state = makeState(1);
    const result = makeResult([5, 4, 4]);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].shouldReset).toBe(false);
  });

  it('success after 2 failures resets counter to 0 and increments weight', () => {
    const state = makeState(2);
    const result = makeResult([5, 5, 5]);
    const update = engine.recordWorkoutResult(state, result);
    const ex = update.exerciseUpdates[0];
    expect(ex.consecutiveFailures).toBe(0);
    expect(ex.shouldReset).toBe(false);
    expect(ex.newWeight).toBe(102.5);
  });

  it('shouldReset() returns true at FAILURE_THRESHOLD consecutive failures', () => {
    const exerciseState = {
      exerciseId: 'squat',
      exerciseName: 'Squat',
      currentWeight: 100,
      consecutiveFailures: 3,
      totalWorkouts: 10,
      lastWorkoutDate: new Date(),
    };
    expect(engine.shouldReset(exerciseState)).toBe(true);
  });

  it('shouldReset() returns false below threshold', () => {
    const exerciseState = {
      exerciseId: 'squat',
      exerciseName: 'Squat',
      currentWeight: 100,
      consecutiveFailures: 2,
      totalWorkouts: 10,
      lastWorkoutDate: new Date(),
    };
    expect(engine.shouldReset(exerciseState)).toBe(false);
  });
});
