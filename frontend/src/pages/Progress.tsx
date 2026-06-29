import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { progressApi } from '../api/progress.api';
import type { ProgressSummary, ProgressDataPoint, PersonalRecord } from '../types/progress.types';
import { useUnit } from '../hooks/useUnit';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

function PRCard({ pr }: { pr: PersonalRecord }) {
  const { display } = useUnit();
  return (
    <div className="rounded-lg bg-zinc-800 p-3 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-white">{pr.exercise.name}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{new Date(pr.date).toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">
          {display(pr.weight)} × {pr.reps}
        </p>
        <p className="text-xs text-zinc-400">{display(pr.estimatedOneRepMax)} est. 1RM</p>
      </div>
    </div>
  );
}

export function Progress() {
  const { display, displayNum, unitLabel } = useUnit();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ProgressDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    Promise.all([progressApi.getSummary(), progressApi.getPRs()])
      .then(([s, p]) => {
        setSummary(s.data.data);
        setPRs(p.data.data);
        if (s.data.data.currentWeights.length > 0) {
          setSelectedExerciseId(s.data.data.currentWeights[0].exerciseId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExerciseId) return;
    setChartLoading(true);
    progressApi
      .getExerciseProgress(selectedExerciseId)
      .then((r) => setChartData(r.data.data))
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, [selectedExerciseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedName =
    summary?.currentWeights.find((cw) => cw.exerciseId === selectedExerciseId)?.exerciseName ?? '';

  const formattedChart = chartData.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: displayNum(d.maxWeight),
    '1RM': displayNum(d.estimated1RM),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Progress</h1>

      {/* Exercise selector */}
      {summary && summary.currentWeights.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {summary.currentWeights.map((cw) => (
            <button
              key={cw.exerciseId}
              onClick={() => setSelectedExerciseId(cw.exerciseId)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedExerciseId === cw.exerciseId
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {cw.exerciseName}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-3">
          {selectedName} — Weight ({unitLabel})
        </h2>
        {chartLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : formattedChart.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-12">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formattedChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="1RM"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Current weights summary */}
      {summary && summary.currentWeights.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Current Working Weights
          </h2>
          <div className="flex flex-col gap-2">
            {summary.currentWeights.map((cw) => (
              <div key={cw.exerciseId} className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">{cw.exerciseName}</span>
                <div className="flex items-center gap-2">
                  {cw.consecutiveFailures > 0 && (
                    <span className="text-xs text-yellow-400">{cw.consecutiveFailures}/3</span>
                  )}
                  <span className="text-sm font-semibold text-white">{display(cw.currentWeight)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Personal Records
          </h2>
          <div className="flex flex-col gap-2">
            {prs.map((pr) => (
              <PRCard key={pr.id} pr={pr} />
            ))}
          </div>
        </div>
      )}

      {!summary || summary.currentWeights.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-12">
          Complete your first workout to see progress here.
        </p>
      ) : null}
    </div>
  );
}
