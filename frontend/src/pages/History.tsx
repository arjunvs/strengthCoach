import { useEffect, useState, useCallback } from 'react';
import { workoutsApi } from '../api/workouts.api';
import type { WorkoutSession } from '../types/workout.types';
import { useUnit } from '../hooks/useUnit';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

function WorkoutCard({
  session,
  onDelete,
  onClick,
}: {
  session: WorkoutSession;
  onDelete: () => void;
  onClick: () => void;
}) {
  const date = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'In progress';

  const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const completedSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="flex items-start justify-between">
        <button onClick={onClick} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-900 text-blue-300 text-sm font-bold">
              {session.workoutType}
            </span>
            <div>
              <p className="font-medium text-white">{date}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {completedSets}/{totalSets} sets · {session.exercises.length} exercises
              </p>
            </div>
          </div>
        </button>
        <button
          onClick={onDelete}
          className="ml-3 text-xs text-zinc-600 hover:text-red-400 transition-colors py-1 px-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function WorkoutDetail({ session }: { session: WorkoutSession }) {
  const { display } = useUnit();
  return (
    <div className="flex flex-col gap-4">
      {session.exercises.map((ex) => (
        <div key={ex.id}>
          <h4 className="text-sm font-semibold text-white mb-2">{ex.exercise.name}</h4>
          <div className="flex flex-col gap-1">
            {ex.sets.map((s) => (
              <div key={s.setNumber} className="flex justify-between text-sm">
                <span className="text-zinc-400">Set {s.setNumber}</span>
                <span className={s.completed ? 'text-white' : 'text-zinc-600'}>
                  {s.reps !== null ? `${s.reps}/${ex.targetReps}` : '—'} × {display(s.weight)}
                  {s.rpe ? ` @ RPE ${s.rpe}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {session.notes && (
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-zinc-300">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

export function History() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback((p: number, replace = false) => {
    const setter = replace ? setLoading : setLoadingMore;
    setter(true);
    workoutsApi
      .getHistory(p)
      .then((r) => {
        const { sessions: s, total: t } = r.data.data;
        setSessions((prev) => (replace ? s : [...prev, ...s]));
        setTotal(t);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setter(false));
  }, []);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await workoutsApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
      setConfirmDelete(null);
      showToast('Workout deleted', 'success');
    } catch {
      showToast('Failed to delete workout', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white">History</h1>
      <p className="text-sm text-zinc-500">{total} workouts total</p>

      {sessions.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-16">
          No workouts yet. Start your first session!
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <WorkoutCard
                key={s.id}
                session={s}
                onClick={() => setSelected(s)}
                onDelete={() => setConfirmDelete(s.id)}
              />
            ))}
          </div>
          {sessions.length < total && (
            <Button
              variant="secondary"
              onClick={() => load(page + 1)}
              loading={loadingMore}
              className="w-full"
            >
              Load more
            </Button>
          )}
        </>
      )}

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Workout ${selected.workoutType} — ${new Date(selected.completedAt ?? selected.startedAt ?? '').toLocaleDateString()}`
            : ''
        }
      >
        {selected && <WorkoutDetail session={selected} />}
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete workout?"
      >
        <p className="text-zinc-400 text-sm mb-4">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
            className="flex-1"
          >
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
