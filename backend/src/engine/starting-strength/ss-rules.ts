export const SS_EXERCISES = {
  SQUAT: {
    name: 'Squat',
    sets: 3,
    reps: 5,
    defaultIncrement: 2.5,
    workouts: ['A', 'B'] as const,
  },
  BENCH: {
    name: 'Bench Press',
    sets: 3,
    reps: 5,
    defaultIncrement: 2.5,
    workouts: ['A'] as const,
  },
  DEADLIFT: {
    name: 'Deadlift',
    sets: 1,
    reps: 5,
    defaultIncrement: 5.0,
    workouts: ['A'] as const,
  },
  OHP: {
    name: 'Overhead Press',
    sets: 3,
    reps: 5,
    defaultIncrement: 2.5,
    workouts: ['B'] as const,
  },
  POWER_CLEAN: {
    name: 'Power Clean',
    sets: 5,
    reps: 3,
    defaultIncrement: 2.5,
    workouts: ['B'] as const,
  },
  BARBELL_ROW: {
    name: 'Barbell Row',
    sets: 5,
    reps: 5,
    defaultIncrement: 2.5,
    workouts: ['B'] as const,
  },
  CHINUPS: {
    name: 'Chinups',
    sets: 3,
    reps: 5,
    defaultIncrement: 0,
    workouts: ['B'] as const,
  },
} as const;

export type SSExerciseKey = keyof typeof SS_EXERCISES;

export const WORKOUT_A_KEYS: SSExerciseKey[] = ['SQUAT', 'BENCH', 'DEADLIFT'];
export const WORKOUT_B_BASE_KEYS: SSExerciseKey[] = ['SQUAT', 'OHP'];

export const ALTERNATE_TO_KEY: Record<string, SSExerciseKey> = {
  POWER_CLEAN: 'POWER_CLEAN',
  BARBELL_ROW: 'BARBELL_ROW',
  CHINUPS: 'CHINUPS',
};

export const FAILURE_THRESHOLD = 3;
export const RESET_PERCENTAGE = 0.10;
export const PLATE_RESOLUTION = 2.5;
