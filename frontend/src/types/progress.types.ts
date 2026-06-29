import type { WorkoutType } from './workout.types';

export interface ProgressDataPoint {
  date: string;
  workoutType: WorkoutType;
  targetWeight: number;
  maxWeight: number;
  totalVolume: number;
  estimated1RM: number;
  completedSets: number;
  targetSets: number;
}

export interface CurrentWeight {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  consecutiveFailures: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}

export interface ProgressSummary {
  currentWeights: CurrentWeight[];
  totalWorkouts: number;
  streak: number;
  lastSession: { id: string; workoutType: WorkoutType; completedAt: string } | null;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string };
  weight: number;
  reps: number;
  date: string;
  estimatedOneRepMax: number;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
}
