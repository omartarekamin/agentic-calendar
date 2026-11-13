import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express, { type RequestHandler } from 'express';
import 'dotenv/config';

process.env.DESCOPE_PROJECT_ID ??= 'test-project';
process.env.DESCOPE_MANAGEMENT_KEY ??= 'test-management-key';
process.env.DESCOPE_CALENDAR_CONNECTION_ID ??= 'google-calendar';

const { createConnectionRouter } = await import('./connection.routes.js');

async function startServer(app: express.Express): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Test server did not start on a TCP port');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

const fakeSession: RequestHandler = (req, _res, next) => {
  req.userId = 'descope-user-1';
  req.dbUserId = 'database-user-1';
  next();
};

const calendarConnection = {
  id: 'google-calendar',
  name: 'Google Calendar',
  status: 'pending' as const,
};

test('POST /connect marks the authenticated user connection as pending', async () => {
  const app = express();
  app.use('/api/connections', createConnectionRouter({
    async markCalendarConnectionPending(databaseUserId) {
      assert.equal(databaseUserId, 'database-user-1');
      return calendarConnection;
    },
    async getCalendarConnection() {
      return calendarConnection;
    },
    async refreshCalendarConnectionStatus() {
      return calendarConnection;
    },
  }, fakeSession));
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/api/connections/connect`, {
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      calendarConnection,
    });
  } finally {
    await server.close();
  }
});

test('GET /calendar-connection returns the authenticated user connection', async () => {
  const app = express();
  app.use('/api/connections', createConnectionRouter({
    async markCalendarConnectionPending() {
      throw new Error('Unexpected connect call');
    },
    async getCalendarConnection(databaseUserId) {
      assert.equal(databaseUserId, 'database-user-1');
      return calendarConnection;
    },
    async refreshCalendarConnectionStatus() {
      throw new Error('Unexpected refresh call');
    },
  }, fakeSession));
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/api/connections/calendar-connection`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { calendarConnection });
  } finally {
    await server.close();
  }
});

test('POST /refresh-status refreshes status for the authenticated user', async () => {
  const app = express();
  app.use('/api/connections', createConnectionRouter({
    async markCalendarConnectionPending() {
      throw new Error('Unexpected connect call');
    },
    async getCalendarConnection() {
      throw new Error('Unexpected get call');
    },
    async refreshCalendarConnectionStatus(authUserId, databaseUserId) {
      assert.equal(authUserId, 'descope-user-1');
      assert.equal(databaseUserId, 'database-user-1');
      return { ...calendarConnection, status: 'connected' };
    },
  }, fakeSession));
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/api/connections/refresh-status`, {
      method: 'POST',
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      calendarConnection: { ...calendarConnection, status: 'connected' },
    });
  } finally {
    await server.close();
  }
});
