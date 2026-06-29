import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { prisma } from '../db/prisma';

export const prRouter = Router();
prRouter.use(requireAuth);

prRouter.get('/', async (req, res) => {
  try {
    const exerciseId = req.query.exerciseId as string | undefined;
    const where = { userId: req.userId!, ...(exerciseId ? { exerciseId } : {}) };

    // Return best PR per exercise
    const exercises = exerciseId
      ? [exerciseId]
      : (await prisma.personalRecord.findMany({ where: { userId: req.userId }, select: { exerciseId: true }, distinct: ['exerciseId'] })).map(
          (p) => p.exerciseId,
        );

    const prs = await Promise.all(
      exercises.map((eid) =>
        prisma.personalRecord.findFirst({
          where: { userId: req.userId!, exerciseId: eid },
          orderBy: { estimatedOneRepMax: 'desc' },
          include: { exercise: true },
        }),
      ),
    );

    res.json({ success: true, data: prs.filter(Boolean) });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});

prRouter.get('/history/:exerciseId', async (req, res) => {
  try {
    const prs = await prisma.personalRecord.findMany({
      where: { userId: req.userId!, exerciseId: req.params.exerciseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: prs });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});
