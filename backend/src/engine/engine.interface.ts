import type {
  ExerciseState,
  ProgramState,
  WorkoutPlan,
  WorkoutResult,
  ProgramStateUpdate,
  ResetResult,
  ProgressionSettings,
} from './engine.types';

export interface ProgressionEngine {
  readonly programName: string;
  calculateNextWorkout(state: ProgramState): WorkoutPlan;
  recordWorkoutResult(state: ProgramState, result: WorkoutResult): ProgramStateUpdate;
  shouldReset(exercise: ExerciseState): boolean;
  calculateReset(exercise: ExerciseState): ResetResult;
  getRecommendedIncrement(exercise: ExerciseState, settings: ProgressionSettings): number;
}
