import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { progressService } from './progress.service';

export const progressRouter = Router();
progressRouter.use(requireAuth);

progressRouter.get('/summary', async (req, res) => {
  try {
    const data = await progressService.getSummary(req.userId!);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});

progressRouter.get('/:exerciseId', async (req, res) => {
  try {
    const data = await progressService.getExerciseProgress(req.userId!, req.params.exerciseId);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});
