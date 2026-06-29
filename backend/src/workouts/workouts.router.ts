import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { workoutsService } from './workouts.service';

export const workoutsRouter = Router();
workoutsRouter.use(requireAuth);

workoutsRouter.get('/next', async (req, res) => {
  try {
    const plan = await workoutsService.getNextWorkout(req.userId!);
    res.json({ success: true, data: plan });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.post('/start', async (req, res) => {
  try {
    const session = await workoutsService.startWorkout(req.userId!);
    res.status(201).json({ success: true, data: session });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const workoutType = req.query.workoutType as 'A' | 'B' | undefined;
    const data = await workoutsService.getHistory(req.userId!, { page, pageSize, workoutType });
    res.json({ success: true, data });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.get('/export', async (req, res) => {
  try {
    const data = await workoutsService.exportData(req.userId!);
    res.setHeader('Content-Disposition', 'attachment; filename="strengthcoach-export.json"');
    res.json(data);
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.get('/:id', async (req, res) => {
  try {
    const session = await workoutsService.getSession(req.userId!, req.params.id);
    res.json({ success: true, data: session });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.put('/:id/exercises/:exerciseId/sets/:setNumber', async (req, res) => {
  try {
    const setNumber = parseInt(req.params.setNumber);
    const set = await workoutsService.recordSet(
      req.userId!,
      req.params.id,
      req.params.exerciseId,
      setNumber,
      req.body,
    );
    res.json({ success: true, data: set });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.post('/:id/complete', async (req, res) => {
  try {
    const result = await workoutsService.completeWorkout(req.userId!, req.params.id, req.body.notes);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

workoutsRouter.delete('/:id', async (req, res) => {
  try {
    await workoutsService.deleteSession(req.userId!, req.params.id);
    res.json({ success: true, data: { message: 'Session deleted' } });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});
