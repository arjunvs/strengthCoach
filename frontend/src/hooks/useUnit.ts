import { useSettingsStore } from '../store/settings.store';

const KG_TO_LB = 2.20462;

export function useUnit() {
  const settings = useSettingsStore((s) => s.settings);
  const isLb = settings?.units === 'LB';

  const display = (kg: number): string => {
    const v = isLb ? kg * KG_TO_LB : kg;
    return `${v % 1 === 0 ? v : v.toFixed(1)} ${isLb ? 'lb' : 'kg'}`;
  };

  const displayNum = (kg: number): number => {
    const v = isLb ? kg * KG_TO_LB : kg;
    return Math.round(v * 10) / 10;
  };

  const toKg = (value: number): number => (isLb ? value / KG_TO_LB : value);

  return { isLb, unitLabel: isLb ? 'lb' : 'kg', display, displayNum, toKg };
}
