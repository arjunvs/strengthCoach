import { useEffect, useState } from 'react';
import type { UserSettings } from '../types/user.types';
import { useSettingsStore } from '../store/settings.store';
import { workoutsApi } from '../api/workouts.api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-zinc-800">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-zinc-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function IncrementField({
  label,
  value,
  onChange,
  unitLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unitLabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, parseFloat((value - 1.25).toFixed(2))))}
          className="w-8 h-8 rounded-md bg-zinc-700 text-white text-lg font-bold hover:bg-zinc-600 transition-colors"
        >
          −
        </button>
        <span className="w-16 text-center text-sm font-semibold text-white">
          {value} {unitLabel}
        </span>
        <button
          onClick={() => onChange(parseFloat((value + 1.25).toFixed(2)))}
          className="w-8 h-8 rounded-md bg-zinc-700 text-white text-lg font-bold hover:bg-zinc-600 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Settings() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<Partial<UserSettings>>({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const merged = { ...settings, ...draft };
  const unitLabel = merged.units === 'LB' ? 'lb' : 'kg';

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(draft);
      showToast('Settings saved', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await workoutsApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strengthcoach-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const set = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Units */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Units</h2>
        <div className="flex gap-2 mt-3">
          {(['KG', 'LB'] as const).map((u) => (
            <button
              key={u}
              onClick={() => set('units', u)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                merged.units === u ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Workout */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Workout</h2>

        <div className="flex items-center justify-between py-3 border-b border-zinc-800">
          <p className="text-sm font-medium text-white">Alternate exercise (Workout B)</p>
          <select
            value={merged.alternateExercise}
            onChange={(e) => set('alternateExercise', e.target.value as UserSettings['alternateExercise'])}
            className="bg-zinc-800 text-white text-sm rounded-lg px-2 py-1 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="POWER_CLEAN">Power Clean</option>
            <option value="BARBELL_ROW">Barbell Row</option>
            <option value="CHINUPS">Chin-ups</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-800">
          <p className="text-sm font-medium text-white">Rest timer (seconds)</p>
          <input
            type="number"
            min={30}
            max={600}
            step={15}
            value={merged.restTimerSeconds}
            onChange={(e) => set('restTimerSeconds', Number(e.target.value))}
            className="w-20 bg-zinc-800 text-white text-sm rounded-lg px-2 py-1 border border-zinc-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Toggle
          label="Dark mode"
          checked={merged.darkMode}
          onChange={(v) => set('darkMode', v)}
        />

        <Toggle
          label="Auto-reduce deadlift increment"
          checked={merged.autoReduceDeadliftIncrement}
          onChange={(v) => set('autoReduceDeadliftIncrement', v)}
          description="Halve the deadlift increment when progress slows"
        />
      </div>

      {/* Increments */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
          Weight Increments
        </h2>
        <IncrementField
          label="Squat"
          value={merged.squatIncrement}
          onChange={(v) => set('squatIncrement', v)}
          unitLabel={unitLabel}
        />
        <IncrementField
          label="Bench Press"
          value={merged.benchIncrement}
          onChange={(v) => set('benchIncrement', v)}
          unitLabel={unitLabel}
        />
        <IncrementField
          label="Overhead Press"
          value={merged.ohpIncrement}
          onChange={(v) => set('ohpIncrement', v)}
          unitLabel={unitLabel}
        />
        <IncrementField
          label="Deadlift"
          value={merged.deadliftIncrement}
          onChange={(v) => set('deadliftIncrement', v)}
          unitLabel={unitLabel}
        />
        <IncrementField
          label="Power Clean / Alternate"
          value={merged.powerCleanIncrement}
          onChange={(v) => set('powerCleanIncrement', v)}
          unitLabel={unitLabel}
        />
      </div>

      <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
        Save Settings
      </Button>

      {/* Export */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Data</h2>
        <Button
          variant="secondary"
          onClick={handleExport}
          loading={exporting}
          className="w-full"
        >
          Export Data (JSON)
        </Button>
      </div>
    </div>
  );
}
