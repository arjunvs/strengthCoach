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

function makeSquatState(weight: number): ProgramState {
  return {
    userId: 'u1',
    lastWorkoutType: 'B',
    exercises: [
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        currentWeight: weight,
        consecutiveFailures: 0,
        totalWorkouts: 1,
        lastWorkoutDate: new Date(),
      },
    ],
    exerciseIdsByName: { Squat: 'squat' },
    settings: BASE_SETTINGS,
  };
}

function makeSuccessResult(exerciseId: string, weight: number, sets = 3, reps = 5): WorkoutResult {
  return {
    sessionId: 's1',
    completedAt: new Date(),
    exercises: [
      {
        exerciseId,
        sets: Array.from({ length: sets }, (_, i) => ({
          setNumber: i + 1,
          repsCompleted: reps,
          targetReps: reps,
          weight,
        })),
      },
    ],
  };
}

describe('StartingStrengthEngine — weight increments', () => {
  let engine: StartingStrengthEngine;

  beforeEach(() => {
    engine = new StartingStrengthEngine();
  });

  it('increments Squat by 2.5 kg after success', () => {
    const state = makeSquatState(100);
    const result = makeSuccessResult('squat', 100, 3, 5);
    const update = engine.recordWorkoutResult(state, result);
    const sq = update.exerciseUpdates.find((u) => u.exerciseId === 'squat')!;
    expect(sq.newWeight).toBe(102.5);
    expect(sq.incrementApplied).toBe(2.5);
    expect(sq.success).toBe(true);
  });

  it('increments Bench Press by 2.5 kg after success', () => {
    const state: ProgramState = {
      userId: 'u1',
      lastWorkoutType: 'A',
      exercises: [{ exerciseId: 'bench', exerciseName: 'Bench Press', currentWeight: 80, consecutiveFailures: 0, totalWorkouts: 1, lastWorkoutDate: null }],
      exerciseIdsByName: { 'Bench Press': 'bench' },
      settings: BASE_SETTINGS,
    };
    const result = makeSuccessResult('bench', 80, 3, 5);
    const update = engine.recordWorkoutResult(state, result);
    const bench = update.exerciseUpdates[0];
    expect(bench.newWeight).toBe(82.5);
    expect(bench.incrementApplied).toBe(2.5);
  });

  it('increments Deadlift by 5 kg after success', () => {
    const state: ProgramState = {
      userId: 'u1',
      lastWorkoutType: 'A',
      exercises: [{ exerciseId: 'dl', exerciseName: 'Deadlift', currentWeight: 120, consecutiveFailures: 0, totalWorkouts: 1, lastWorkoutDate: null }],
      exerciseIdsByName: { Deadlift: 'dl' },
      settings: BASE_SETTINGS,
    };
    const result = makeSuccessResult('dl', 120, 1, 5);
    const update = engine.recordWorkoutResult(state, result);
    const dl = update.exerciseUpdates[0];
    expect(dl.newWeight).toBe(125);
    expect(dl.incrementApplied).toBe(5);
  });

  it('increments Overhead Press by 2.5 kg', () => {
    const state: ProgramState = {
      userId: 'u1',
      lastWorkoutType: 'B',
      exercises: [{ exerciseId: 'ohp', exerciseName: 'Overhead Press', currentWeight: 60, consecutiveFailures: 0, totalWorkouts: 1, lastWorkoutDate: null }],
      exerciseIdsByName: { 'Overhead Press': 'ohp' },
      settings: BASE_SETTINGS,
    };
    const result = makeSuccessResult('ohp', 60, 3, 5);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].newWeight).toBe(62.5);
  });

  it('uses custom increment from settings when provided', () => {
    const state: ProgramState = {
      ...makeSquatState(100),
      settings: { ...BASE_SETTINGS, increments: { squat: 5 } },
    };
    const result = makeSuccessResult('squat', 100, 3, 5);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.exerciseUpdates[0].newWeight).toBe(105);
    expect(update.exerciseUpdates[0].incrementApplied).toBe(5);
  });

  it('rounds new weight to nearest 2.5', () => {
    const state: ProgramState = {
      ...makeSquatState(101.3), // non-aligned starting weight
      settings: { ...BASE_SETTINGS, increments: { squat: 1.25 } },
    };
    const result = makeSuccessResult('squat', 101.3, 3, 5);
    const update = engine.recordWorkoutResult(state, result);
    // 101.3 + 1.25 = 102.55 → round to 102.5
    expect(update.exerciseUpdates[0].newWeight).toBe(102.5);
  });

  it('determines nextWorkoutType as B when current lastWorkoutType is A', () => {
    const state = makeSquatState(100);
    const result = makeSuccessResult('squat', 100);
    const update = engine.recordWorkoutResult(state, result);
    expect(update.nextWorkoutType).toBe('A'); // state.lastWorkoutType is 'B', so next is 'A'
  });
});
