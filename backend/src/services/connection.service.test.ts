import assert from 'node:assert/strict';
import { test } from 'node:test';
import 'dotenv/config';

process.env.DESCOPE_PROJECT_ID ??= 'test-project';
process.env.DESCOPE_MANAGEMENT_KEY ??= 'test-management-key';
process.env.DESCOPE_CALENDAR_CONNECTION_ID ??= 'google-calendar';

const { createConnectionService } = await import('./connection.service.js');

function createService(connectedApps: string[] = []) {
  const savedStatuses: string[] = [];
  let statusLookupUser: string | undefined;

  const service = createConnectionService({
    connectionId: 'google-calendar',
    repository: {
      async getStatus(userId) {
        statusLookupUser = userId;
        return null;
      },
      async saveStatus(userId, status) {
        assert.equal(userId, 'database-user-1');
        savedStatuses.push(status);
      },
    },
    outboundApplicationManagement: {
      async listAppsWithUserToken(userId) {
        assert.equal(userId, 'descope-user-1');
        return { data: connectedApps };
      },
    },
  });

  return {
    service,
    savedStatuses,
    get statusLookupUser() {
      return statusLookupUser;
    },
  };
}

test('marks a user-scoped calendar connection pending', async () => {
  const fixture = createService();
  const result = await fixture.service.markCalendarConnectionPending('database-user-1');

  assert.deepEqual(result, {
    id: 'google-calendar',
    name: 'Google Calendar',
    status: 'pending',
  });
  assert.deepEqual(fixture.savedStatuses, ['pending']);
});

test('reads an unrecorded calendar connection as disconnected', async () => {
  const fixture = createService();

  assert.deepEqual(await fixture.service.getCalendarConnection('database-user-1'), {
    id: 'google-calendar',
    name: 'Google Calendar',
    status: 'disconnected',
  });
  assert.equal(fixture.statusLookupUser, 'database-user-1');
});

test('refreshes and persists the Descope connection status', async () => {
  const fixture = createService(['google-calendar']);
  const result = await fixture.service.refreshCalendarConnectionStatus(
    'descope-user-1',
    'database-user-1',
  );

  assert.equal(result.status, 'connected');
  assert.deepEqual(fixture.savedStatuses, ['connected']);
});

test('persists disconnected status when Descope has no user token', async () => {
  const fixture = createService();
  const result = await fixture.service.refreshCalendarConnectionStatus(
    'descope-user-1',
    'database-user-1',
  );

  assert.equal(result.status, 'disconnected');
  assert.deepEqual(fixture.savedStatuses, ['disconnected']);
});
