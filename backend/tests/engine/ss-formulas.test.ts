import { describe, it, expect } from 'vitest';
import {
  epley1RM,
  roundToIncrement,
  floorToIncrement,
  calculateResetWeight,
  isFullSuccess,
  totalVolume,
  best1RM,
} from '../../src/engine/starting-strength/ss-formulas';

describe('epley1RM', () => {
  it('returns weight unchanged for 1 rep', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });

  it('calculates correctly for 5 reps', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.67, 1);
  });

  it('calculates correctly for 10 reps', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it('increases with more reps at same weight', () => {
    expect(epley1RM(80, 5)).toBeGreaterThan(epley1RM(80, 4));
    expect(epley1RM(80, 10)).toBeGreaterThan(epley1RM(80, 5));
  });
});

describe('roundToIncrement', () => {
  it('rounds up to nearest 2.5', () => {
    expect(roundToIncrement(101.3, 2.5)).toBe(102.5);
  });

  it('rounds down to nearest 2.5', () => {
    expect(roundToIncrement(98.7, 2.5)).toBe(97.5);
  });

  it('leaves an already-aligned value unchanged', () => {
    expect(roundToIncrement(100, 2.5)).toBe(100);
    expect(roundToIncrement(102.5, 2.5)).toBe(102.5);
  });

  it('handles increment of 5', () => {
    expect(roundToIncrement(143, 5)).toBe(145);
    expect(roundToIncrement(147, 5)).toBe(145);
  });

  it('returns weight unchanged when increment is 0', () => {
    expect(roundToIncrement(73.3, 0)).toBe(73.3);
  });
});

describe('floorToIncrement', () => {
  it('floors down to nearest 2.5', () => {
    expect(floorToIncrement(101.3, 2.5)).toBe(100);
    expect(floorToIncrement(102.4, 2.5)).toBe(100);
  });

  it('leaves aligned value unchanged', () => {
    expect(floorToIncrement(100, 2.5)).toBe(100);
  });
});

describe('calculateResetWeight', () => {
  it('reduces 100kg by 10% to 90kg', () => {
    expect(calculateResetWeight(100, 0.10, 2.5)).toBe(90);
  });

  it('reduces 117.5kg by 10% and floors to increment', () => {
    // 117.5 * 0.9 = 105.75 → floor to 105
    expect(calculateResetWeight(117.5, 0.10, 2.5)).toBe(105);
  });

  it('reduces 120kg by 10% to 107.5', () => {
    // 120 * 0.9 = 108 → floor to 107.5
    expect(calculateResetWeight(120, 0.10, 2.5)).toBe(107.5);
  });

  it('handles 5% reduction', () => {
    expect(calculateResetWeight(100, 0.05, 2.5)).toBe(95);
  });
});

describe('isFullSuccess', () => {
  it('returns true when all sets meet target reps', () => {
    const sets = [
      { setNumber: 1, repsCompleted: 5, targetReps: 5, weight: 80 },
      { setNumber: 2, repsCompleted: 5, targetReps: 5, weight: 80 },
      { setNumber: 3, repsCompleted: 5, targetReps: 5, weight: 80 },
    ];
    expect(isFullSuccess(sets, 5)).toBe(true);
  });

  it('returns true when reps exceed target', () => {
    const sets = [{ setNumber: 1, repsCompleted: 6, targetReps: 5, weight: 80 }];
    expect(isFullSuccess(sets, 5)).toBe(true);
  });

  it('returns false when any set misses target reps', () => {
    const sets = [
      { setNumber: 1, repsCompleted: 5, targetReps: 5, weight: 80 },
      { setNumber: 2, repsCompleted: 4, targetReps: 5, weight: 80 },
      { setNumber: 3, repsCompleted: 5, targetReps: 5, weight: 80 },
    ];
    expect(isFullSuccess(sets, 5)).toBe(false);
  });

  it('returns false for empty sets array', () => {
    expect(isFullSuccess([], 5)).toBe(false);
  });
});

describe('totalVolume', () => {
  it('calculates sum of weight × reps', () => {
    const sets = [
      { setNumber: 1, repsCompleted: 5, targetReps: 5, weight: 80 },
      { setNumber: 2, repsCompleted: 5, targetReps: 5, weight: 80 },
      { setNumber: 3, repsCompleted: 4, targetReps: 5, weight: 80 },
    ];
    expect(totalVolume(sets)).toBe(80 * 5 + 80 * 5 + 80 * 4); // 1120
  });
});

describe('best1RM', () => {
  it('returns the highest estimated 1RM across sets', () => {
    const sets = [
      { setNumber: 1, repsCompleted: 5, targetReps: 5, weight: 100 },
      { setNumber: 2, repsCompleted: 4, targetReps: 5, weight: 100 },
    ];
    // set 1: epley1RM(100,5) = 116.67; set 2: epley1RM(100,4) = 113.33
    expect(best1RM(sets)).toBeCloseTo(116.67, 1);
  });
});
