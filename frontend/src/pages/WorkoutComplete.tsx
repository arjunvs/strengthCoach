import { useLocation, useNavigate } from 'react-router-dom';
import type { WorkoutCompleteResult } from '../types/workout.types';
import { useUnit } from '../hooks/useUnit';
import { Button } from '../components/common/Button';

export function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { display } = useUnit();

  const result: WorkoutCompleteResult | undefined = location.state?.result;
  const exerciseNames: Record<string, string> = location.state?.exerciseNames ?? {};

  if (!result) {
    navigate('/');
    return null;
  }

  const exName = (id: string) => exerciseNames[id] ?? id;

  const { update } = result;
  const hasNewPRs = update.newPRs.length > 0;
  const resets = update.exerciseUpdates.filter((u) => u.shouldReset);
  const increments = update.exerciseUpdates.filter((u) => !u.shouldReset && u.incrementApplied > 0);
  const failures = update.exerciseUpdates.filter(
    (u) => !u.shouldReset && !u.success && u.consecutiveFailures > 0,
  );

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-white">Workout Complete!</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Next up: Workout {update.nextWorkoutType}
        </p>
      </div>

      {hasNewPRs && (
        <div className="rounded-xl bg-yellow-950 border border-yellow-800 p-4">
          <h2 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide mb-2">
            New Personal Records
          </h2>
          <div className="flex flex-col gap-1.5">
            {update.newPRs.map((pr) => (
              <div key={pr.exerciseId} className="flex justify-between text-sm">
                <span className="text-yellow-200">{exName(pr.exerciseId)}</span>
                <span className="text-yellow-100 font-semibold">
                  {display(pr.weight)} × {pr.reps} ({display(pr.estimatedOneRepMax)} 1RM)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resets.length > 0 && (
        <div className="rounded-xl bg-red-950 border border-red-800 p-4">
          <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wide mb-2">
            Weight Reset (3 consecutive failures)
          </h2>
          <div className="flex flex-col gap-1.5">
            {resets.map((u) => (
              <div key={u.exerciseId} className="flex justify-between text-sm">
                <span className="text-red-200">{exName(u.exerciseId)}</span>
                <span className="text-red-100">
                  {display(u.resetFromWeight ?? u.newWeight)} → {display(u.newWeight)} (−10%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {increments.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            Weight Increases
          </h2>
          <div className="flex flex-col gap-1.5">
            {increments.map((u) => (
              <div key={u.exerciseId} className="flex justify-between text-sm">
                <span className="text-zinc-300">{exName(u.exerciseId)}</span>
                <span className="text-green-400 font-medium">
                  {display(u.newWeight - u.incrementApplied)} → {display(u.newWeight)}{' '}
                  <span className="text-green-600">(+{display(u.incrementApplied)})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {failures.length > 0 && !resets.length && (
        <div className="rounded-xl bg-yellow-950/50 border border-yellow-900 p-4">
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-2">
            Stalling
          </h2>
          <div className="flex flex-col gap-1.5">
            {failures.map((u) => (
              <div key={u.exerciseId} className="flex justify-between text-sm">
                <span className="text-yellow-200">{exName(u.exerciseId)}</span>
                <span className="text-yellow-300">{u.consecutiveFailures}/3 failures</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  );
}
