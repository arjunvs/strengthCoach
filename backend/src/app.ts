import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { authRouter } from './auth/auth.router';
import { workoutsRouter } from './workouts/workouts.router';
import { progressRouter } from './progress/progress.router';
import { settingsRouter } from './settings/settings.router';
import { bodyweightRouter } from './bodyweight/bodyweight.router';
import { prRouter } from './personal-records/pr.router';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/body-weight', bodyweightRouter);
app.use('/api/personal-records', prRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});
