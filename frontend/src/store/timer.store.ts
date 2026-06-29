import { create } from 'zustand';

interface TimerStore {
  seconds: number;
  totalSeconds: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  tick: () => void;
  reset: (duration: number) => void;
}

export const useTimerStore = create<TimerStore>((set) => ({
  seconds: 0,
  totalSeconds: 0,
  isRunning: false,
  start: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false }),
  tick: () => set((s) => ({ seconds: Math.max(0, s.seconds - 1) })),
  reset: (duration: number) => set({ seconds: duration, totalSeconds: duration, isRunning: false }),
}));
