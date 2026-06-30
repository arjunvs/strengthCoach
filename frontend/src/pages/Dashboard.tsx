import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressApi } from '../api/progress.api';
import { workoutsApi } from '../api/workouts.api';
import type { ProgressSummary } from '../types/progress.types';
import type { NextWorkoutPlan } from '../types/workout.types';
import { useUnit } from '../hooks/useUnit';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSettingsStore } from '../store/settings.store';

function StatsCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const color = streak >= 7 ? 'text-yellow-400' : streak >= 3 ? 'text-blue-400' : 'text-zinc-400';
  return (
    <span className={`text-sm font-medium ${color}`}>
      {streak > 0 ? `🔥 ${streak}-day streak` : 'No active streak'}
    </span>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { display } = useUnit();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [nextPlan, setNextPlan] = useState<NextWorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    Promise.all([progressApi.getSummary(), workoutsApi.getNext()])
      .then(([s, n]) => {
        setSummary(s.data.data);
        setNextPlan(n.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const lastDate = summary?.lastSession?.completedAt
    ? new Date(summary.lastSession.completedAt).toLocaleDateString()
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        {summary && (
          <div className="mt-1">
            <StreakBadge streak={summary.streak} />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard label="Total Workouts" value={summary?.totalWorkouts ?? 0} />
        <StatsCard
          label="Last Workout"
          value={lastDate ?? '—'}
          sub={summary?.lastSession ? `Workout ${summary.lastSession.workoutType}` : undefined}
        />
        <StatsCard
          label="Next Up"
          value={nextPlan ? `Workout ${nextPlan.workoutType}` : '—'}
          sub={nextPlan ? `${nextPlan.exercises.length} exercises` : undefined}
        />
      </div>

      {/* Next workout preview */}
      {nextPlan && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Next: Workout {nextPlan.workoutType}
            </h2>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {nextPlan.exercises.map((ex) => (
              <div key={ex.exerciseId} className="flex justify-between items-center text-sm">
                <span className="text-zinc-300">{ex.exerciseName}</span>
                <span className="text-zinc-400">
                  {ex.sets}×{ex.reps} @ {display(ex.targetWeight)}
                </span>
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={() => navigate('/workout')}>
            Start Workout {nextPlan.workoutType}
          </Button>
        </div>
      )}

      {/* Current weights */}
      {summary && summary.currentWeights.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
            Current Weights
          </h2>
          <div className="flex flex-col gap-2">
            {summary.currentWeights.map((cw) => (
              <div key={cw.exerciseId} className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-zinc-300">{cw.exerciseName}</span>
                  {cw.consecutiveFailures > 0 && (
                    <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      cw.consecutiveFailures >= 2 ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {cw.consecutiveFailures}/3
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-white">{display(cw.currentWeight)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
