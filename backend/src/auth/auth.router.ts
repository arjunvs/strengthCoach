import { Router } from 'express';
import { authService } from './auth.service';
import { requireAuth } from './auth.middleware';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'email, password, name required' } });
      return;
    }
    const data = await authService.register(email.toLowerCase().trim(), password, name.trim());
    res.status(201).json({ success: true, data });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'email and password required' } });
      return;
    }
    const data = await authService.login(email.toLowerCase().trim(), password);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, error: { code: e.code ?? 'ERROR', message: e.message } });
  }
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  res.json({ success: true, data: { message: 'Logged out' } });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const { prisma } = await import('../db/prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ success: false, error: { code: 'ERROR', message: e.message } });
  }
});
