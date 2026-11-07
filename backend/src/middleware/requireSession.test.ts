import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import 'dotenv/config';

process.env.DESCOPE_PROJECT_ID ??= 'test-project';
process.env.DESCOPE_MANAGEMENT_KEY ??= 'test-management-key';

const { createRequireSession } = await import('./requireSession.js');

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

test('rejects requests without a bearer token', async () => {
  let validatorCalled = false;
  const app = express();
  app.get(
    '/protected',
    createRequireSession(async () => {
      validatorCalled = true;
      return { token: { sub: 'user-123' } };
    }),
    (_req, res) => res.sendStatus(204),
  );
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/protected`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: {
        code: 'UNAUTHENTICATED',
        message: 'A valid session is required',
      },
    });
    assert.equal(validatorCalled, false);
  } finally {
    await server.close();
  }
});

test('validates the bearer token and exposes its claims and database user ID', async () => {
  const app = express();
  app.get(
    '/protected',
    createRequireSession(async (token) => {
      assert.equal(token, 'valid-session-token');
      return {
        token: {
          sub: 'user-123',
          email: 'user@example.com',
          customClaim: 'claim-value',
        },
      };
    }, async (authUserId, email) => {
      assert.equal(authUserId, 'user-123');
      assert.equal(email, 'user@example.com');
      return { id: 'database-user-123' };
    }),
    (req, res) =>
      res.json({
        userId: req.userId,
        dbUserId: req.dbUserId,
        email: req.user?.email,
        customClaim: req.user?.customClaim,
      }),
  );
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/protected`, {
      headers: { Authorization: 'Bearer valid-session-token' },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      userId: 'user-123',
      dbUserId: 'database-user-123',
      email: 'user@example.com',
      customClaim: 'claim-value',
    });
  } finally {
    await server.close();
  }
});

test('rejects invalid tokens and validated tokens without a subject', async () => {
  const app = express();
  app.get(
    '/invalid',
    createRequireSession(async () => {
      throw new Error('Invalid session');
    }, async () => ({ id: 'database-user-123' })),
    (_req, res) => res.sendStatus(204),
  );
  app.get(
    '/missing-subject',
    createRequireSession(async () => ({ token: {} }), async () => ({
      id: 'database-user-123',
    })),
    (_req, res) => res.sendStatus(204),
  );
  const server = await startServer(app);

  try {
    const invalidResponse = await fetch(`${server.url}/invalid`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    const missingSubjectResponse = await fetch(`${server.url}/missing-subject`, {
      headers: { Authorization: 'Bearer no-subject-token' },
    });

    assert.equal(invalidResponse.status, 401);
    assert.equal(missingSubjectResponse.status, 401);
  } finally {
    await server.close();
  }
});

const sessionToken = process.env.DESCOPE_SESSION_TOKEN;
test('validates a real Descope session token when configured', { skip: !sessionToken }, async () => {
  if (!sessionToken) {
    return;
  }

  const { descopeClient } = await import('../config/descope.js');
  const authInfo = await descopeClient.validateSession(sessionToken);
  assert.ok(authInfo.token.sub);
});
