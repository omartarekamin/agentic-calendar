import { getPool } from '../db/pool.js';

export type CalendarConnectionStatus = 'connected' | 'disconnected' | 'pending';

interface ConnectionRow {
  status: CalendarConnectionStatus;
}

export async function getCalendarConnectionStatus(
  userId: string,
): Promise<CalendarConnectionStatus | null> {
  const { rows } = await getPool().query<ConnectionRow>(
    `SELECT status
     FROM connections
     WHERE user_id = $1 AND provider = 'calendar'`,
    [userId],
  );

  return rows[0]?.status ?? null;
}

export async function saveCalendarConnectionStatus(
  userId: string,
  status: CalendarConnectionStatus,
): Promise<void> {
  await getPool().query(
    `INSERT INTO connections (user_id, provider, status)
     VALUES ($1, 'calendar', $2)
     ON CONFLICT (user_id, provider)
     DO UPDATE SET status = EXCLUDED.status`,
    [userId, status],
  );
}