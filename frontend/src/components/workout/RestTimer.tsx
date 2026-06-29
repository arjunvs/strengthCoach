import { useEffect } from 'react';
import { useTimerStore } from '../../store/timer.store';

export function RestTimer() {
  const { seconds, totalSeconds, isRunning, tick, stop } = useTimerStore();

  useEffect(() => {
    if (!isRunning) return;
    if (seconds === 0) {
      stop();
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      return;
    }
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [isRunning, seconds, tick, stop]);

  if (!isRunning && seconds === 0) return null;

  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds <= 10 && isRunning;

  return (
    <div
      className={`fixed bottom-20 md:bottom-4 left-0 right-0 mx-4 md:mx-auto md:max-w-md rounded-xl border p-3 flex items-center gap-3 shadow-lg z-40 ${
        urgent ? 'bg-red-900 border-red-700' : 'bg-zinc-800 border-zinc-700'
      }`}
    >
      <div className="flex-1">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">Rest Timer</p>
        <p className={`text-2xl font-mono font-bold ${urgent ? 'text-red-300' : 'text-white'}`}>
          {mins}:{String(secs).padStart(2, '0')}
        </p>
        <div className="mt-1 h-1 rounded-full bg-zinc-700">
          <div
            className={`h-1 rounded-full transition-all duration-1000 ${urgent ? 'bg-red-400' : 'bg-blue-500'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <button
        onClick={stop}
        className="text-sm text-zinc-400 hover:text-white px-3 py-1 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        Skip
      </button>
    </div>
  );
}
