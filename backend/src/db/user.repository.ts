import { getPool } from './pool.js';

export interface UserRecord {
  id: string;
  authUserId: string;
  email: string | null;
  createdAt: Date;
}

interface UserRow {
  id: string;
  auth_user_id: string;
  email: string | null;
  created_at: Date;
}

export async function upsertUser(
  authUserId: string,
  email: string | null,
): Promise<UserRecord> {
  const { rows } = await getPool().query<UserRow>(
    `INSERT INTO users (auth_user_id, email)
     VALUES ($1, $2)
     ON CONFLICT (auth_user_id)
     DO UPDATE SET email = COALESCE(EXCLUDED.email, users.email)
     RETURNING id, auth_user_id, email, created_at`,
    [authUserId, email],
  );
  const row = rows[0];

  if (!row) {
    throw new Error('User upsert did not return a user record.');
  }

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    createdAt: row.created_at,
  };
}
