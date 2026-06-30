import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workout.store';
import { useTimerStore } from '../store/timer.store';
import { useSettingsStore } from '../store/settings.store';
import { useUnit } from '../hooks/useUnit';
import type { WorkoutExercise } from '../types/workout.types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { RestTimer } from '../components/workout/RestTimer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

function SetRow({
  setNum,
  targetReps,
  targetWeight,
  logged,
  onLog,
}: {
  setNum: number;
  targetReps: number;
  targetWeight: number;
  logged: { repsCompleted: number | null; completed: boolean; rpe: number | null } | undefined;
  onLog: (reps: number, rpe: number | null) => void;
}) {
  const { display } = useUnit();
  const [reps, setReps] = useState(targetReps);
  const [rpe, setRpe] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const done = logged?.completed;

  return (
    <>
      <div
        className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
          done ? 'bg-zinc-800' : 'bg-zinc-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
              done ? 'bg-green-700 text-white' : 'bg-zinc-700 text-zinc-300'
            }`}
          >
            {done ? '✓' : setNum}
          </span>
          <div>
            <span className="text-sm text-zinc-300">{display(targetWeight)}</span>
            <span className="text-xs text-zinc-500 ml-2">× {targetReps}</span>
          </div>
        </div>
        {done ? (
          <span className="text-sm text-zinc-400">
            {logged!.repsCompleted}/{targetReps}
            {logged!.rpe ? ` · RPE ${logged!.rpe}` : ''}
          </span>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            Log set
          </Button>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Set ${setNum} — ${display(targetWeight)}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide">Reps completed</label>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setReps((r) => Math.max(0, r - 1))}
                className="w-11 h-11 rounded-full bg-zinc-700 text-white text-xl font-bold hover:bg-zinc-600 transition-colors"
              >
                −
              </button>
              <span className="text-3xl font-bold text-white w-12 text-center">{reps}</span>
              <button
                onClick={() => setReps((r) => r + 1)}
                className="w-11 h-11 rounded-full bg-zinc-700 text-white text-xl font-bold hover:bg-zinc-600 transition-colors"
              >
                +
              </button>
            </div>
            {reps < targetReps && reps > 0 && (
              <p className="text-xs text-yellow-400 mt-1">Partial rep ({reps}/{targetReps})</p>
            )}
            {reps === 0 && (
              <p className="text-xs text-red-400 mt-1">0 reps = failed set</p>
            )}
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide">RPE (optional)</label>
            <div className="flex gap-1 mt-2 flex-wrap">
              {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => (
                <button
                  key={r}
                  onClick={() => setRpe(rpe === r ? null : r)}
                  className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                    rpe === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => {
              onLog(reps, rpe);
              setOpen(false);
            }}
            className="w-full"
          >
            Save set
          </Button>
        </div>
      </Modal>
    </>
  );
}

function ExerciseCard({
  exercise,
  setRecords,
  onSetLogged,
}: {
  exercise: WorkoutExercise;
  setRecords: Record<string, { repsCompleted: number | null; completed: boolean; rpe: number | null; weight: number }>;
  onSetLogged: (exerciseId: string, setNum: number, reps: number, weight: number, rpe: number | null) => void;
}) {
  const failures = exercise.sets.filter((_, i) => {
    const key = `${exercise.id}-${i + 1}`;
    const rec = setRecords[key];
    return rec?.completed && (rec.repsCompleted ?? 0) < exercise.targetReps;
  }).length;

  const allLogged = exercise.sets.every((_, i) => setRecords[`${exercise.id}-${i + 1}`]?.completed);

  return (
    <div className={`rounded-xl border p-4 ${allLogged ? 'border-green-800 bg-green-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{exercise.exercise.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {exercise.targetSets} × {exercise.targetReps}
          </p>
        </div>
        {failures >= 2 && !allLogged && (
          <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full font-medium">
            Stalling
          </span>
        )}
        {allLogged && (
          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full font-medium">
            Done
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {exercise.sets.map((s) => (
          <SetRow
            key={s.setNumber}
            setNum={s.setNumber}
            targetReps={exercise.targetReps}
            targetWeight={exercise.targetWeight}
            logged={setRecords[`${exercise.id}-${s.setNumber}`]}
            onLog={(reps, rpe) => onSetLogged(exercise.id, s.setNumber, reps, exercise.targetWeight, rpe)}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkoutActive() {
  const navigate = useNavigate();
  const { session, setRecords, recordSet, completeWorkout, isLoading } = useWorkoutStore();
  const { reset: resetTimer, start: startTimer } = useTimerStore();
  const settings = useSettingsStore((s) => s.settings);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/workout');
    }
  }, [session, navigate]);

  if (!session) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const allSetsLogged = session.exercises.every((ex) =>
    ex.sets.every((s) => setRecords[`${ex.id}-${s.setNumber}`]?.completed),
  );

  const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const completedSets = Object.values(setRecords).filter((r) => r.completed).length;

  const handleSetLogged = async (exerciseId: string, setNum: number, reps: number, weight: number, rpe: number | null) => {
    await recordSet(exerciseId, setNum, reps, weight, rpe ?? undefined);
    const duration = settings?.restTimerSeconds ?? 180;
    resetTimer(duration);
    startTimer();
  };

  const handleComplete = async () => {
    setCompleting(true);
    // Capture exercise name map before session is cleared
    const exerciseNames: Record<string, string> = {};
    session.exercises.forEach((ex) => { exerciseNames[ex.exerciseId] = ex.exercise.name; });
    try {
      const result = await completeWorkout(notes || undefined);
      navigate('/workout/complete', { state: { result, exerciseNames } });
    } catch {
      setCompleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto pb-48">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Workout {session.workoutType}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{completedSets}/{totalSets} sets done</p>
        </div>
        <div className="w-16 h-16">
          <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3f3f46" strokeWidth="3.8" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3.8"
              strokeDasharray={`${(completedSets / Math.max(totalSets, 1)) * 100} 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            setRecords={setRecords}
            onSetLogged={handleSetLogged}
          />
        ))}
      </div>

      {allSetsLogged && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-zinc-400 hover:text-white transition-colors text-left"
          >
            {showNotes ? '▾ Hide notes' : '▸ Add workout notes'}
          </button>
          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel? Any notes..."
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <Button
            onClick={handleComplete}
            loading={completing || isLoading}
            size="lg"
            className="w-full"
          >
            Finish Workout
          </Button>
        </div>
      )}

      <RestTimer />
    </div>
  );
}
