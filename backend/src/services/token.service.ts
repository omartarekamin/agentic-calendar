import {
  DESCOPE_CALENDAR_CONNECTION_ID,
  descopeClient,
} from "../config/descope.js";

/**
 * Fetches a user's Google Calendar access token from Descope without exposing it.
 */
export async function getCalendarAccessToken(authUserId: string) {
  const response =
    await descopeClient.management.outboundApplication.fetchToken(
      DESCOPE_CALENDAR_CONNECTION_ID,
      authUserId,
    );

  if (!response.ok || !response.data?.accessToken) {
    throw new Error(
      "Calendar access token is unavailable; check the user's connection.",
    );
  }

  return response.data.accessToken;
}
