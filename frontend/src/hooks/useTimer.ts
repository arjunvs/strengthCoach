import { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '../store/timer.store';

export function useTimer() {
  const { seconds, totalSeconds, isRunning, start, stop, tick, reset } = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(
    (durationSeconds: number) => {
      stop();
      reset(durationSeconds);
      // start on next tick so state settles
      setTimeout(() => start(), 0);
    },
    [start, stop, reset],
  );

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      const currentSeconds = useTimerStore.getState().seconds;
      if (currentSeconds <= 0) {
        stop();
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      } else {
        tick();
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, stop, tick]);

  const progress = totalSeconds > 0 ? (totalSeconds - seconds) / totalSeconds : 0;

  return { seconds, totalSeconds, isRunning, progress, startTimer, stop, reset };
}
