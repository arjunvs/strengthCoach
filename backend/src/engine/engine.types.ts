export interface ExerciseState {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  consecutiveFailures: number;
  totalWorkouts: number;
  lastWorkoutDate: Date | null;
}

export interface ProgressionSettings {
  units: 'KG' | 'LB';
  alternateExercise: 'POWER_CLEAN' | 'BARBELL_ROW' | 'CHINUPS';
  increments: Record<string, number>;
  autoReduceDeadliftIncrement: boolean;
  restTimerSeconds: number;
}

export interface ProgramState {
  userId: string;
  lastWorkoutType: 'A' | 'B' | null;
  exercises: ExerciseState[];
  exerciseIdsByName: Record<string, string>;
  settings: ProgressionSettings;
}

export interface ExercisePlan {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetWeight: number;
  order: number;
}

export interface WorkoutPlan {
  workoutType: 'A' | 'B';
  exercises: ExercisePlan[];
}

export interface SetResult {
  setNumber: number;
  repsCompleted: number;
  targetReps: number;
  weight: number;
}

export interface ExerciseResult {
  exerciseId: string;
  sets: SetResult[];
  notes?: string;
  rpe?: number;
}

export interface WorkoutResult {
  sessionId: string;
  completedAt: Date;
  exercises: ExerciseResult[];
}

export interface ExerciseStateUpdate {
  exerciseId: string;
  newWeight: number;
  consecutiveFailures: number;
  shouldReset: boolean;
  resetFromWeight?: number;
  incrementApplied: number;
  success: boolean;
}

export interface NewPR {
  exerciseId: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
}

export interface ProgramStateUpdate {
  nextWorkoutType: 'A' | 'B';
  exerciseUpdates: ExerciseStateUpdate[];
  newPRs: NewPR[];
}

export interface ResetResult {
  exerciseId: string;
  resetWeight: number;
  resetFromWeight: number;
  percentReduction: number;
}
