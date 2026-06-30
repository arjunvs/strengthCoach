import { create } from 'zustand';
import type { UserSettings } from '../types/user.types';
import { settingsApi } from '../api/settings.api';

interface SettingsStore {
  settings: UserSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await settingsApi.get();
      set({ settings: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const res = await settingsApi.update(updates);
    set({ settings: res.data.data });
    // Apply dark mode immediately
    if ('darkMode' in updates) {
      document.documentElement.classList.toggle('dark', updates.darkMode!);
    }
  },
}));
