import { apiClient } from './client';
import type { NextWorkoutPlan, WorkoutSession, WorkoutCompleteResult } from '../types/workout.types';

export const workoutsApi = {
  getNext: () =>
    apiClient.get<{ success: boolean; data: NextWorkoutPlan }>('/workouts/next'),

  start: () =>
    apiClient.post<{ success: boolean; data: WorkoutSession }>('/workouts/start'),

  getSession: (id: string) =>
    apiClient.get<{ success: boolean; data: WorkoutSession }>(`/workouts/${id}`),

  recordSet: (
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    data: { reps?: number; completed?: boolean; rpe?: number; notes?: string; weight?: number },
  ) =>
    apiClient.put(`/workouts/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`, data),

  complete: (sessionId: string, notes?: string) =>
    apiClient.post<{ success: boolean; data: WorkoutCompleteResult }>(`/workouts/${sessionId}/complete`, { notes }),

  getHistory: (page = 1, pageSize = 20) =>
    apiClient.get<{ success: boolean; data: { sessions: WorkoutSession[]; total: number } }>(
      `/workouts/history?page=${page}&pageSize=${pageSize}`,
    ),

  deleteSession: (id: string) => apiClient.delete(`/workouts/${id}`),

  exportData: () => apiClient.get('/workouts/export'),
};
