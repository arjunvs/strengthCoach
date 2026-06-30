import { prisma } from '../db/prisma';
import { epley1RM } from '../engine/starting-strength/ss-formulas';

export class ProgressService {
  async getSummary(userId: string) {
    const [progressions, lastSession, totalWorkouts, streak] = await Promise.all([
      prisma.progressionState.findMany({ where: { userId }, include: { exercise: true } }),
      prisma.workoutSession.findFirst({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        include: {
          exercises: { include: { exercise: true, sets: true }, orderBy: { order: 'asc' } },
        },
      }),
      prisma.workoutSession.count({ where: { userId, completedAt: { not: null } } }),
      this._calculateStreak(userId),
    ]);

    const currentWeights = progressions.map((p) => ({
      exerciseId: p.exerciseId,
      exerciseName: p.exercise.name,
      currentWeight: p.currentWeight,
      consecutiveFailures: p.consecutiveFailures,
      totalWorkouts: p.totalWorkouts,
      lastWorkoutDate: p.lastWorkoutDate,
    }));

    return { currentWeights, lastSession, totalWorkouts, streak };
  }

  async getExerciseProgress(userId: string, exerciseId: string) {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'asc' },
      include: {
        exercises: {
          where: { exerciseId },
          include: { sets: true },
        },
      },
    });

    const dataPoints = sessions
      .filter((s) => s.exercises.length > 0)
      .map((s) => {
        const we = s.exercises[0];
        const completedSets = we.sets.filter((set) => set.reps !== null);
        const maxWeight = completedSets.reduce((m, set) => (set.weight > m ? set.weight : m), 0);
        const totalVol = completedSets.reduce((v, set) => v + set.weight * (set.reps ?? 0), 0);
        const best1rm = completedSets.reduce((best, set) => {
          const e = epley1RM(set.weight, set.reps ?? 0);
          return e > best ? e : best;
        }, 0);
        return {
          date: s.completedAt,
          workoutType: s.workoutType,
          targetWeight: we.targetWeight,
          maxWeight,
          totalVolume: totalVol,
          estimated1RM: best1rm,
          completedSets: completedSets.length,
          targetSets: we.targetSets,
        };
      });

    return dataPoints;
  }

  private async _calculateStreak(userId: string): Promise<number> {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 30,
      select: { completedAt: true },
    });

    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const seenWeeks = new Set<string>();
    for (const s of sessions) {
      const d = new Date(s.completedAt!);
      const week = `${d.getFullYear()}-W${Math.floor(d.getDate() / 7)}`;
      seenWeeks.add(week);
    }
    streak = seenWeeks.size;
    return streak;
  }
}

export const progressService = new ProgressService();
