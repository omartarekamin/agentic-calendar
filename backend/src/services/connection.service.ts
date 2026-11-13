import { descopeClient, DESCOPE_CALENDAR_CONNECTION_ID } from '../config/descope.js';
import {
  getCalendarConnectionStatus,
  saveCalendarConnectionStatus,
  type CalendarConnectionStatus,
} from '../repositories/connection.repository.js';

const CALENDAR_CONNECTION_NAME = 'Google Calendar';

export interface CalendarConnection {
  id: string;
  name: string;
  status: CalendarConnectionStatus;
}

interface ConnectionRepository {
  getStatus(userId: string): Promise<CalendarConnectionStatus | null>;
  saveStatus(userId: string, status: CalendarConnectionStatus): Promise<void>;
}

interface OutboundApplicationManagement {
  listAppsWithUserToken(userId: string): Promise<DescopeSdkResponse<string[]>>;
}

interface DescopeSdkError {
  errorCode?: string;
}

interface DescopeSdkResponse<T> {
  data?: T;
  error?: DescopeSdkError;
}

interface ConnectionServiceDependencies {
  connectionId: string;
  repository: ConnectionRepository;
  outboundApplicationManagement: OutboundApplicationManagement;
}

class DescopeRequestError extends Error {
  readonly code: string;

  constructor(errorCode?: string) {
    super('Descope request failed.');
    this.name = 'DescopeRequestError';
    this.code = errorCode ?? 'DESCOPE_API_ERROR';
  }
}

function throwForDescopeError(error?: DescopeSdkError): void {
  if (error) {
    throw new DescopeRequestError(error.errorCode);
  }
}

function toCalendarConnection(
  connectionId: string,
  status: CalendarConnectionStatus,
): CalendarConnection {
  return {
    id: connectionId,
    name: CALENDAR_CONNECTION_NAME,
    status,
  };
}

export function createConnectionService({
  connectionId,
  repository,
  outboundApplicationManagement,
}: ConnectionServiceDependencies) {
  return {
    async markCalendarConnectionPending(
      databaseUserId: string,
    ): Promise<CalendarConnection> {
      await repository.saveStatus(databaseUserId, 'pending');
      return toCalendarConnection(connectionId, 'pending');
    },

    async getCalendarConnection(databaseUserId: string): Promise<CalendarConnection> {
      const status = await repository.getStatus(databaseUserId);
      return toCalendarConnection(connectionId, status ?? 'disconnected');
    },

    async refreshCalendarConnectionStatus(
      authUserId: string,
      databaseUserId: string,
    ): Promise<CalendarConnection> {
      const response =
        await outboundApplicationManagement.listAppsWithUserToken(authUserId);
      throwForDescopeError(response.error);
      const { data: connectedApps } = response;
      if (!connectedApps) {
        throw new Error('Descope did not return calendar connection status.');
      }

      const status = connectedApps.includes(connectionId) ? 'connected' : 'disconnected';
      await repository.saveStatus(databaseUserId, status);
      return toCalendarConnection(connectionId, status);
    },
  };
}

export const connectionService = createConnectionService({
  connectionId: DESCOPE_CALENDAR_CONNECTION_ID,
  repository: {
    getStatus: getCalendarConnectionStatus,
    saveStatus: saveCalendarConnectionStatus,
  },
  outboundApplicationManagement: descopeClient.management.outboundApplication,
});