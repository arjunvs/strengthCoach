export type WorkoutType = 'A' | 'B';
export type WeightUnit = 'KG' | 'LB';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultIncrement: number;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number;
  completed: boolean;
  notes: string | null;
  rpe: number | null;
  durationSeconds: number | null;
  recordedAt: string | null;
}

export interface WorkoutExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  exercise: Exercise;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutType: WorkoutType;
  scheduledDate: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  bodyweight: number | null;
  exercises: WorkoutExercise[];
}

export interface ExercisePlan {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetWeight: number;
  order: number;
}

export interface NextWorkoutPlan {
  workoutType: WorkoutType;
  exercises: ExercisePlan[];
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

export interface WorkoutCompleteResult {
  sessionId: string;
  update: {
    nextWorkoutType: WorkoutType;
    exerciseUpdates: ExerciseStateUpdate[];
    newPRs: { exerciseId: string; weight: number; reps: number; estimatedOneRepMax: number }[];
  };
}
