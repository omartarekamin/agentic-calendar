import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool, getPool } from './pool.js';

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../sql');

async function runMigrations(): Promise<void> {
  const pool = getPool();
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
  );

  const migrationFiles = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error(`No SQL migrations found in ${migrationsDirectory}.`);
  }

  for (const filename of migrationFiles) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename],
    );

    if (rowCount) {
      console.log(`Skipping already applied migration ${filename}`);
      continue;
    }

    const sql = await readFile(resolve(migrationsDirectory, filename), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied migration ${filename}`);
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          `Migration ${filename} failed and its transaction could not be rolled back.`,
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }
}

try {
  await runMigrations();
} catch (error) {
  console.error(
    'Database migration failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
} finally {
  await closePool();
}
