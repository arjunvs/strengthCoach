import { apiClient } from './client';
import type { UserSettings } from '../types/user.types';

export const settingsApi = {
  get: () => apiClient.get<{ success: boolean; data: UserSettings }>('/settings'),
  update: (updates: Partial<UserSettings>) =>
    apiClient.put<{ success: boolean; data: UserSettings }>('/settings', updates),
};
