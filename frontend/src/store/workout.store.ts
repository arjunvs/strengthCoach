import { create } from 'zustand';
import type { WorkoutSession, WorkoutCompleteResult } from '../types/workout.types';
import { workoutsApi } from '../api/workouts.api';

interface SetRecord {
  repsCompleted: number | null;
  completed: boolean;
  rpe: number | null;
  weight: number;
}

interface WorkoutStore {
  session: WorkoutSession | null;
  setRecords: Record<string, SetRecord>; // key: `${workoutExerciseId}-${setNumber}`
  isLoading: boolean;
  error: string | null;

  startWorkout: () => Promise<void>;
  recordSet: (workoutExerciseId: string, setNumber: number, reps: number, weight: number, rpe?: number) => Promise<void>;
  completeWorkout: (notes?: string) => Promise<WorkoutCompleteResult>;
  clearSession: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  session: null,
  setRecords: {},
  isLoading: false,
  error: null,

  startWorkout: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await workoutsApi.start();
      set({ session: res.data.data, setRecords: {}, isLoading: false });
    } catch (err: unknown) {
      const e = err as { message?: string };
      set({ error: e.message ?? 'Failed to start workout', isLoading: false });
      throw err;
    }
  },

  recordSet: async (workoutExerciseId, setNumber, reps, weight, rpe) => {
    const key = `${workoutExerciseId}-${setNumber}`;
    // Optimistic update
    set((s) => ({
      setRecords: {
        ...s.setRecords,
        [key]: { repsCompleted: reps, completed: true, rpe: rpe ?? null, weight },
      },
    }));
    await workoutsApi.recordSet(get().session!.id, workoutExerciseId, setNumber, {
      reps,
      completed: true,
      rpe,
      weight,
    });
  },

  completeWorkout: async (notes) => {
    const sessionId = get().session!.id;
    const res = await workoutsApi.complete(sessionId, notes);
    get().clearSession();
    return res.data.data;
  },

  clearSession: () => set({ session: null, setRecords: {}, error: null }),
}));
