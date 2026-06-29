import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutsApi } from '../api/workouts.api';
import type { NextWorkoutPlan } from '../types/workout.types';
import { useWorkoutStore } from '../store/workout.store';
import { useUnit } from '../hooks/useUnit';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function WorkoutPage() {
  const navigate = useNavigate();
  const { display } = useUnit();
  const { startWorkout, isLoading } = useWorkoutStore();
  const [plan, setPlan] = useState<NextWorkoutPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    workoutsApi
      .getNext()
      .then((r) => setPlan(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingPlan(false));
  }, []);

  const handleStart = async () => {
    try {
      await startWorkout();
      navigate('/workout/active');
    } catch {
      // error displayed via store
    }
  };

  if (loadingPlan) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return <p className="text-zinc-400 text-center py-20">Unable to load workout plan.</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Workout {plan.workoutType}</h1>
        <p className="mt-1 text-zinc-400 text-sm">Today's session preview</p>
      </div>

      <div className="flex flex-col gap-3">
        {plan.exercises.map((ex) => (
          <div
            key={ex.exerciseId}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{ex.exerciseName}</h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {ex.sets} sets × {ex.reps} reps
                </p>
              </div>
              <span className="text-lg font-bold text-white">{display(ex.targetWeight)}</span>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleStart}
        loading={isLoading}
        className="w-full"
        size="lg"
      >
        Start Workout {plan.workoutType}
      </Button>
    </div>
  );
}
