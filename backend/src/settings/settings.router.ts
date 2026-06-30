import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { settingsService } from './settings.service';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', async (req, res) => {
  try {
    const settings = await settingsService.getSettings(req.userId!);
    res.json({ success: true, data: settings });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});

settingsRouter.put('/', async (req, res) => {
  try {
    const settings = await settingsService.updateSettings(req.userId!, req.body);
    res.json({ success: true, data: settings });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});
