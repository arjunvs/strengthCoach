import { create } from 'zustand';
import type { User } from '../types/user.types';

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('sc_user') ?? 'null'); } catch { return null; }
  })(),
  token: localStorage.getItem('sc_token'),

  setAuth: (user, token) => {
    localStorage.setItem('sc_token', token);
    localStorage.setItem('sc_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    set({ user: null, token: null });
  },
}));
