import type { ProgressionEngine } from '../engine.interface';
import type {
  ExerciseState,
  ExercisePlan,
  ProgressionSettings,
  ProgramState,
  WorkoutPlan,
  WorkoutResult,
  ProgramStateUpdate,
  ExerciseStateUpdate,
  ResetResult,
} from '../engine.types';
import {
  SS_EXERCISES,
  WORKOUT_A_KEYS,
  WORKOUT_B_BASE_KEYS,
  ALTERNATE_TO_KEY,
  FAILURE_THRESHOLD,
  RESET_PERCENTAGE,
  PLATE_RESOLUTION,
} from './ss-rules';
import {
  epley1RM,
  roundToIncrement,
  calculateResetWeight,
  isFullSuccess,
  best1RM,
} from './ss-formulas';

export class StartingStrengthEngine implements ProgressionEngine {
  readonly programName = 'Starting Strength LP';

  calculateNextWorkout(state: ProgramState): WorkoutPlan {
    const nextType: 'A' | 'B' = state.lastWorkoutType === 'A' ? 'B' : 'A';
    const exercises = this._buildExercisePlan(nextType, state);
    return { workoutType: nextType, exercises };
  }

  recordWorkoutResult(state: ProgramState, result: WorkoutResult): ProgramStateUpdate {
    const exerciseUpdates: ExerciseStateUpdate[] = [];
    const newPRs = [];

    for (const exResult of result.exercises) {
      const exState = state.exercises.find((e) => e.exerciseId === exResult.exerciseId);
      if (!exState) continue;

      const targetReps = this._getTargetReps(exState.exerciseName);
      const success = isFullSuccess(exResult.sets, targetReps);

      let newFailures = success ? 0 : exState.consecutiveFailures + 1;
      const shouldReset = newFailures >= FAILURE_THRESHOLD;

      let newWeight: number;
      let increment = 0;

      if (shouldReset) {
        newWeight = calculateResetWeight(exState.currentWeight, RESET_PERCENTAGE, PLATE_RESOLUTION);
        newFailures = 0;
      } else if (success) {
        increment = this.getRecommendedIncrement(exState, state.settings);
        newWeight = roundToIncrement(exState.currentWeight + increment, PLATE_RESOLUTION);
      } else {
        newWeight = exState.currentWeight;
      }

      const e1rm = best1RM(exResult.sets);
      newPRs.push({
        exerciseId: exResult.exerciseId,
        weight: exResult.sets.reduce((max, s) => (s.weight > max ? s.weight : max), 0),
        reps: exResult.sets.reduce((max, s) => (s.repsCompleted > max ? s.repsCompleted : max), 0),
        estimatedOneRepMax: e1rm,
      });

      exerciseUpdates.push({
        exerciseId: exResult.exerciseId,
        newWeight,
        consecutiveFailures: newFailures,
        shouldReset,
        resetFromWeight: shouldReset ? exState.currentWeight : undefined,
        incrementApplied: increment,
        success,
      });
    }

    const nextWorkoutType: 'A' | 'B' = state.lastWorkoutType === 'A' ? 'B' : 'A';
    return { nextWorkoutType, exerciseUpdates, newPRs };
  }

  shouldReset(exercise: ExerciseState): boolean {
    return exercise.consecutiveFailures >= FAILURE_THRESHOLD;
  }

  calculateReset(exercise: ExerciseState): ResetResult {
    const resetWeight = calculateResetWeight(
      exercise.currentWeight,
      RESET_PERCENTAGE,
      PLATE_RESOLUTION,
    );
    return {
      exerciseId: exercise.exerciseId,
      resetWeight,
      resetFromWeight: exercise.currentWeight,
      percentReduction: RESET_PERCENTAGE * 100,
    };
  }

  getRecommendedIncrement(exercise: ExerciseState, settings: ProgressionSettings): number {
    const overridden = settings.increments[exercise.exerciseId];
    if (overridden !== undefined) return overridden;

    const key = this._nameToKey(exercise.exerciseName);
    if (key) return SS_EXERCISES[key].defaultIncrement;
    return 2.5;
  }

  private _buildExercisePlan(type: 'A' | 'B', state: ProgramState): ExercisePlan[] {
    const keys = type === 'A' ? WORKOUT_A_KEYS : this._bWorkoutKeys(state.settings);
    return keys.map((key, idx) => {
      const rule = SS_EXERCISES[key];
      const exState = state.exercises.find((e) => e.exerciseName === rule.name);
      const exerciseId = exState?.exerciseId ?? state.exerciseIdsByName[rule.name] ?? '';
      const targetWeight = exState?.currentWeight ?? 20;
      return {
        exerciseId,
        exerciseName: rule.name,
        sets: rule.sets,
        reps: rule.reps,
        targetWeight,
        order: idx,
      };
    });
  }

  private _bWorkoutKeys(settings: ProgressionSettings): (keyof typeof SS_EXERCISES)[] {
    const altKey = ALTERNATE_TO_KEY[settings.alternateExercise] ?? 'POWER_CLEAN';
    return [...WORKOUT_B_BASE_KEYS, altKey];
  }

  private _getTargetReps(exerciseName: string): number {
    const key = this._nameToKey(exerciseName);
    return key ? SS_EXERCISES[key].reps : 5;
  }

  private _nameToKey(name: string): keyof typeof SS_EXERCISES | null {
    return (
      (Object.keys(SS_EXERCISES) as Array<keyof typeof SS_EXERCISES>).find(
        (k) => SS_EXERCISES[k].name === name,
      ) ?? null
    );
  }
}

export function epley1RMExport(weight: number, reps: number): number {
  return epley1RM(weight, reps);
}
