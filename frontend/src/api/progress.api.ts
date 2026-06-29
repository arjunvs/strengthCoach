import { apiClient } from './client';
import type { ProgressSummary, ProgressDataPoint, PersonalRecord, BodyWeightEntry } from '../types/progress.types';

export const progressApi = {
  getSummary: () =>
    apiClient.get<{ success: boolean; data: ProgressSummary }>('/progress/summary'),

  getExerciseProgress: (exerciseId: string) =>
    apiClient.get<{ success: boolean; data: ProgressDataPoint[] }>(`/progress/${exerciseId}`),

  getPRs: (exerciseId?: string) =>
    apiClient.get<{ success: boolean; data: PersonalRecord[] }>(
      exerciseId ? `/personal-records?exerciseId=${exerciseId}` : '/personal-records',
    ),

  getBodyWeight: () =>
    apiClient.get<{ success: boolean; data: BodyWeightEntry[] }>('/body-weight'),

  logBodyWeight: (weight: number, date?: string) =>
    apiClient.post<{ success: boolean; data: BodyWeightEntry }>('/body-weight', { weight, date }),
};
