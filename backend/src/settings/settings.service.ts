import { prisma } from '../db/prisma';
import type { WeightUnit, AlternateExercise, WorkoutDayPattern } from '@prisma/client';

export interface SettingsUpdate {
  units?: WeightUnit;
  workoutDayPattern?: WorkoutDayPattern;
  customWorkoutDays?: number[];
  darkMode?: boolean;
  alternateExercise?: AlternateExercise;
  autoReduceDeadliftIncrement?: boolean;
  restTimerSeconds?: number;
  squatIncrement?: number;
  benchIncrement?: number;
  ohpIncrement?: number;
  deadliftIncrement?: number;
  powerCleanIncrement?: number;
}

export class SettingsService {
  async getSettings(userId: string) {
    const existing = await prisma.userSettings.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.userSettings.create({ data: { userId } });
  }

  async updateSettings(userId: string, updates: SettingsUpdate) {
    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...updates },
      update: updates,
    });
    return this.getSettings(userId);
  }
}

export const settingsService = new SettingsService();
