import { apiURLs } from "./apiURLs";

export type CalendarConnectionStatus =
  | "connected"
  | "disconnected"
  | "pending";

export interface CalendarConnection {
  id: string;
  name: string;
  status: CalendarConnectionStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCalendarConnection(value: unknown): CalendarConnection {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (value.status !== "connected" &&
      value.status !== "disconnected" &&
      value.status !== "pending")
  ) {
    throw new Error("Unexpected calendar connection response.");
  }

  return {
    id: value.id,
    name: value.name,
    status: value.status,
  };
}

function getErrorMessage(payload: unknown, status: number): string {
  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return `Calendar connection request failed (${status}).`;
}

async function postConnectionRequest(
  url: string,
  sessionToken: string,
): Promise<unknown> {
  if (!sessionToken) {
    throw new Error("The Descope session token is not available.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  return payload;
}

export async function startCalendarConnection(
  sessionToken: string,
): Promise<CalendarConnection> {
  const payload = await postConnectionRequest(
    apiURLs.calendarConnect,
    sessionToken,
  );

  if (!isRecord(payload)) {
    throw new Error("Unexpected calendar connection response.");
  }

  return parseCalendarConnection(payload.calendarConnection);
}

export async function refreshCalendarConnectionStatus(
  sessionToken: string,
): Promise<CalendarConnection> {
  const payload = await postConnectionRequest(
    apiURLs.calendarConnectionRefreshStatus,
    sessionToken,
  );

  if (!isRecord(payload)) {
    throw new Error("Unexpected calendar connection response.");
  }

  return parseCalendarConnection(payload.calendarConnection);
}
