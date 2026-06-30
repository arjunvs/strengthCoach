import { describe, it, expect, beforeEach } from 'vitest';
import { StartingStrengthEngine } from '../../src/engine/starting-strength/ss-engine';
import type { ProgramState } from '../../src/engine/engine.types';

const BASE_EXERCISES = [
  { exerciseId: 'squat', exerciseName: 'Squat', currentWeight: 100, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
  { exerciseId: 'bench', exerciseName: 'Bench Press', currentWeight: 80, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
  { exerciseId: 'deadlift', exerciseName: 'Deadlift', currentWeight: 120, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
  { exerciseId: 'ohp', exerciseName: 'Overhead Press', currentWeight: 60, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
  { exerciseId: 'pclean', exerciseName: 'Power Clean', currentWeight: 50, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
  { exerciseId: 'brow', exerciseName: 'Barbell Row', currentWeight: 60, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
  { exerciseId: 'chins', exerciseName: 'Chinups', currentWeight: 0, consecutiveFailures: 0, totalWorkouts: 5, lastWorkoutDate: null },
];

const BASE_SETTINGS = {
  units: 'KG' as const,
  alternateExercise: 'POWER_CLEAN' as const,
  increments: {},
  autoReduceDeadliftIncrement: false,
  restTimerSeconds: 180,
};

const BASE_IDS: Record<string, string> = {
  'Squat': 'squat',
  'Bench Press': 'bench',
  'Deadlift': 'deadlift',
  'Overhead Press': 'ohp',
  'Power Clean': 'pclean',
  'Barbell Row': 'brow',
  'Chinups': 'chins',
};

function makeState(lastWorkoutType: 'A' | 'B' | null, alternate: 'POWER_CLEAN' | 'BARBELL_ROW' | 'CHINUPS' = 'POWER_CLEAN'): ProgramState {
  return {
    userId: 'u1',
    lastWorkoutType,
    exercises: [...BASE_EXERCISES],
    exerciseIdsByName: BASE_IDS,
    settings: { ...BASE_SETTINGS, alternateExercise: alternate },
  };
}

describe('StartingStrengthEngine — workout alternation', () => {
  let engine: StartingStrengthEngine;

  beforeEach(() => {
    engine = new StartingStrengthEngine();
  });

  it('starts with Workout A when no prior workout', () => {
    const plan = engine.calculateNextWorkout(makeState(null));
    expect(plan.workoutType).toBe('A');
  });

  it('alternates A → B', () => {
    const plan = engine.calculateNextWorkout(makeState('A'));
    expect(plan.workoutType).toBe('B');
  });

  it('alternates B → A', () => {
    const plan = engine.calculateNextWorkout(makeState('B'));
    expect(plan.workoutType).toBe('A');
  });

  it('Workout A contains Squat, Bench Press, Deadlift (in that order)', () => {
    const plan = engine.calculateNextWorkout(makeState(null));
    const names = plan.exercises.map((e) => e.exerciseName);
    expect(names).toEqual(['Squat', 'Bench Press', 'Deadlift']);
  });

  it('Workout B contains Squat, Overhead Press, Power Clean by default', () => {
    const plan = engine.calculateNextWorkout(makeState('A'));
    const names = plan.exercises.map((e) => e.exerciseName);
    expect(names).toEqual(['Squat', 'Overhead Press', 'Power Clean']);
  });

  it('Workout B uses Barbell Row when configured', () => {
    const plan = engine.calculateNextWorkout(makeState('A', 'BARBELL_ROW'));
    const names = plan.exercises.map((e) => e.exerciseName);
    expect(names).toContain('Barbell Row');
    expect(names).not.toContain('Power Clean');
  });

  it('Workout B uses Chinups when configured', () => {
    const plan = engine.calculateNextWorkout(makeState('A', 'CHINUPS'));
    const names = plan.exercises.map((e) => e.exerciseName);
    expect(names).toContain('Chinups');
  });

  it('alternation is independent of time elapsed (missed days do not reset)', () => {
    // After A workout 30 days ago, next should still be B
    const exercises = BASE_EXERCISES.map((e) => ({
      ...e,
      lastWorkoutDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    }));
    const state: ProgramState = { ...makeState('A'), exercises };
    const plan = engine.calculateNextWorkout(state);
    expect(plan.workoutType).toBe('B');
  });

  it('Workout A sets correct sets/reps for each exercise', () => {
    const plan = engine.calculateNextWorkout(makeState(null));
    const squat = plan.exercises.find((e) => e.exerciseName === 'Squat')!;
    expect(squat.sets).toBe(3);
    expect(squat.reps).toBe(5);

    const deadlift = plan.exercises.find((e) => e.exerciseName === 'Deadlift')!;
    expect(deadlift.sets).toBe(1);
    expect(deadlift.reps).toBe(5);
  });

  it('Power Clean is 5x3', () => {
    const plan = engine.calculateNextWorkout(makeState('A'));
    const pc = plan.exercises.find((e) => e.exerciseName === 'Power Clean')!;
    expect(pc.sets).toBe(5);
    expect(pc.reps).toBe(3);
  });
});
