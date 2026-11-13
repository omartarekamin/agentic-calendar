import { Router, type Request, type RequestHandler, type Response } from 'express';
import { requireSession } from '../middleware/requireSession.js';
import {
  connectionService,
  type CalendarConnection,
} from '../services/connection.service.js';

interface ConnectionService {
  markCalendarConnectionPending(
    databaseUserId: string,
  ): Promise<CalendarConnection>;
  getCalendarConnection(databaseUserId: string): Promise<CalendarConnection>;
  refreshCalendarConnectionStatus(
    authUserId: string,
    databaseUserId: string,
  ): Promise<CalendarConnection>;
}

function getUserIds(
  req: Request,
  res: Response,
): { authUserId: string; databaseUserId: string } | null {
  if (!req.userId || !req.dbUserId) {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'A valid session is required' },
    });
    return null;
  }

  return { authUserId: req.userId, databaseUserId: req.dbUserId };
}

export function createConnectionRouter(
  service: ConnectionService = connectionService,
  sessionMiddleware: RequestHandler = requireSession,
): Router {
  const router = Router();
  router.use(sessionMiddleware);

  router.post('/connect', async (req, res) => {
    const user = getUserIds(req, res);
    if (!user) return;

    const calendarConnection = await service.markCalendarConnectionPending(
      user.databaseUserId,
    );
    res.status(200).json({ calendarConnection });
  });

  router.get('/calendar-connection', async (req, res) => {
    const user = getUserIds(req, res);
    if (!user) return;

    const calendarConnection = await service.getCalendarConnection(user.databaseUserId);
    res.status(200).json({ calendarConnection });
  });

  router.post('/refresh-status', async (req, res) => {
    const user = getUserIds(req, res);
    if (!user) return;

    const calendarConnection = await service.refreshCalendarConnectionStatus(
      user.authUserId,
      user.databaseUserId,
    );
    res.status(200).json({ calendarConnection });
  });

  return router;
}