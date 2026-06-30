import { apiClient } from './client';
import type { User } from '../types/user.types';

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiClient.post<{ success: boolean; data: { user: User; token: string } }>('/auth/register', {
      email,
      password,
      name,
    }),

  login: (email: string, password: string) =>
    apiClient.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', {
      email,
      password,
    }),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<{ success: boolean; data: User }>('/auth/me'),
};
