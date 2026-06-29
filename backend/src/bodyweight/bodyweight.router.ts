import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { prisma } from '../db/prisma';

export const bodyweightRouter = Router();
bodyweightRouter.use(requireAuth);

bodyweightRouter.get('/', async (req, res) => {
  try {
    const entries = await prisma.bodyWeight.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 90,
    });
    res.json({ success: true, data: entries });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});

bodyweightRouter.post('/', async (req, res) => {
  try {
    const { weight, date } = req.body as { weight?: number; date?: string };
    if (!weight || weight <= 0) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'weight required' } });
      return;
    }
    const entry = await prisma.bodyWeight.upsert({
      where: { userId_date: { userId: req.userId!, date: new Date(date ?? new Date().toISOString().split('T')[0]) } },
      create: { userId: req.userId!, weight, date: new Date(date ?? new Date().toISOString().split('T')[0]) },
      update: { weight },
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});
