import { prisma } from '../db/prisma';
import { settingsService } from '../settings/settings.service';
import { StartingStrengthEngine } from '../engine/starting-strength/ss-engine';
import type { ProgramState, ProgressionSettings, ExerciseState, WorkoutResult } from '../engine/engine.types';
import type { WorkoutType } from '@prisma/client';

const engine = new StartingStrengthEngine();

async function buildProgramState(userId: string): Promise<ProgramState> {
  const [settings, progressions, exercises, lastSession] = await Promise.all([
    settingsService.getSettings(userId),
    prisma.progressionState.findMany({ where: { userId }, include: { exercise: true } }),
    prisma.exercise.findMany(),
    prisma.workoutSession.findFirst({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  const exerciseIdsByName: Record<string, string> = {};
  exercises.forEach((e) => { exerciseIdsByName[e.name] = e.id; });

  const progSettings: ProgressionSettings = {
    units: settings.units,
    alternateExercise: settings.alternateExercise,
    increments: {}, // per-exercise overrides could be stored; use defaults for now
    autoReduceDeadliftIncrement: settings.autoReduceDeadliftIncrement,
    restTimerSeconds: settings.restTimerSeconds,
  };

  const exerciseStates: ExerciseState[] = progressions.map((p) => ({
    exerciseId: p.exerciseId,
    exerciseName: p.exercise.name,
    currentWeight: p.currentWeight,
    consecutiveFailures: p.consecutiveFailures,
    totalWorkouts: p.totalWorkouts,
    lastWorkoutDate: p.lastWorkoutDate,
  }));

  // Also include exercises not yet started (currentWeight = default starting)
  for (const ex of exercises) {
    if (!exerciseStates.find((e) => e.exerciseId === ex.id)) {
      exerciseStates.push({
        exerciseId: ex.id,
        exerciseName: ex.name,
        currentWeight: 20, // empty bar starting weight
        consecutiveFailures: 0,
        totalWorkouts: 0,
        lastWorkoutDate: null,
      });
    }
  }

  return {
    userId,
    lastWorkoutType: (lastSession?.workoutType ?? null) as 'A' | 'B' | null,
    exercises: exerciseStates,
    exerciseIdsByName,
    settings: progSettings,
  };
}

export class WorkoutsService {
  async getNextWorkout(userId: string) {
    const state = await buildProgramState(userId);
    return engine.calculateNextWorkout(state);
  }

  async startWorkout(userId: string) {
    const state = await buildProgramState(userId);
    const plan = engine.calculateNextWorkout(state);

    const session = await prisma.workoutSession.create({
      data: {
        userId,
        workoutType: plan.workoutType as WorkoutType,
        scheduledDate: new Date(),
        startedAt: new Date(),
        exercises: {
          create: plan.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.sets,
            targetReps: ex.reps,
            targetWeight: ex.targetWeight,
            sets: {
              create: Array.from({ length: ex.sets }, (_, i) => ({
                setNumber: i + 1,
                weight: ex.targetWeight,
                completed: false,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        },
      },
    });
    return session;
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        },
      },
    });
    if (!session) throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND', status: 404 });
    return session;
  }

  async recordSet(
    userId: string,
    sessionId: string,
    workoutExerciseId: string,
    setNumber: number,
    data: { reps?: number; completed?: boolean; rpe?: number; notes?: string; weight?: number },
  ) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId, completedAt: null },
    });
    if (!session) throw Object.assign(new Error('Active session not found'), { code: 'NOT_FOUND', status: 404 });

    const set = await prisma.workoutSet.findFirst({
      where: { workoutExerciseId, setNumber },
    });
    if (!set) throw Object.assign(new Error('Set not found'), { code: 'NOT_FOUND', status: 404 });

    return prisma.workoutSet.update({
      where: { id: set.id },
      data: { ...data, recordedAt: new Date() },
    });
  }

  async completeWorkout(userId: string, sessionId: string, notes?: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId, completedAt: null },
      include: {
        exercises: {
          include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        },
      },
    });
    if (!session) throw Object.assign(new Error('Active session not found'), { code: 'NOT_FOUND', status: 404 });

    const state = await buildProgramState(userId);

    const workoutResult: WorkoutResult = {
      sessionId,
      completedAt: new Date(),
      exercises: session.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        sets: we.sets
          .filter((s) => s.reps !== null)
          .map((s) => ({
            setNumber: s.setNumber,
            repsCompleted: s.reps ?? 0,
            targetReps: we.targetReps,
            weight: s.weight,
          })),
      })),
    };

    const update = engine.recordWorkoutResult(state, workoutResult);

    // Apply engine updates transactionally
    await prisma.$transaction(async (tx) => {
      // Mark session complete
      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { completedAt: new Date(), notes: notes ?? null },
      });

      // Update progression states
      for (const ex of update.exerciseUpdates) {
        await tx.progressionState.upsert({
          where: { userId_exerciseId: { userId, exerciseId: ex.exerciseId } },
          create: {
            userId,
            exerciseId: ex.exerciseId,
            currentWeight: ex.newWeight,
            consecutiveFailures: ex.consecutiveFailures,
            lastWorkoutDate: new Date(),
            totalWorkouts: 1,
            lastResetDate: ex.shouldReset ? new Date() : null,
            lastResetFromWeight: ex.shouldReset ? ex.resetFromWeight ?? null : null,
          },
          update: {
            currentWeight: ex.newWeight,
            consecutiveFailures: ex.consecutiveFailures,
            lastWorkoutDate: new Date(),
            totalWorkouts: { increment: 1 },
            lastResetDate: ex.shouldReset ? new Date() : undefined,
            lastResetFromWeight: ex.shouldReset ? ex.resetFromWeight ?? null : undefined,
          },
        });
      }

      // Upsert personal records (only if actually better)
      for (const pr of update.newPRs) {
        const existing = await tx.personalRecord.findFirst({
          where: { userId, exerciseId: pr.exerciseId },
          orderBy: { estimatedOneRepMax: 'desc' },
        });
        if (!existing || pr.estimatedOneRepMax > existing.estimatedOneRepMax) {
          await tx.personalRecord.create({
            data: {
              userId,
              exerciseId: pr.exerciseId,
              weight: pr.weight,
              reps: pr.reps,
              date: new Date(),
              estimatedOneRepMax: pr.estimatedOneRepMax,
              sessionId,
            },
          });
        }
      }
    });

    return { update, sessionId };
  }

  async getHistory(
    userId: string,
    options: { page?: number; pageSize?: number; workoutType?: 'A' | 'B' } = {},
  ) {
    const { page = 1, pageSize = 20, workoutType } = options;
    const where = {
      userId,
      completedAt: { not: null },
      ...(workoutType ? { workoutType: workoutType as WorkoutType } : {}),
    };
    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true, sets: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workoutSession.count({ where }),
    ]);
    return { sessions, total, page, pageSize };
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND', status: 404 });
    await prisma.workoutSession.delete({ where: { id: sessionId } });
  }

  async exportData(userId: string) {
    const [sessions, progressions, bodyweights, prs, settings] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId },
        include: { exercises: { include: { exercise: true, sets: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.progressionState.findMany({ where: { userId }, include: { exercise: true } }),
      prisma.bodyWeight.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      prisma.personalRecord.findMany({ where: { userId }, include: { exercise: true }, orderBy: { createdAt: 'desc' } }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);
    return { sessions, progressions, bodyweights, prs, settings };
  }
}

export const workoutsService = new WorkoutsService();
