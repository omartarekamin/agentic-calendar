import { google } from "googleapis";
import { randomUUID } from "node:crypto";
import { getCalendarDayBounds } from "./calendar-date.js";
import { getCalendarAccessToken } from "./token.service.js";

/**
 * Creates a Google Calendar client authenticated with a user's access token.
 */
function calendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}

/**
 * Loads the authenticated user's token and returns their Calendar API client.
 */
async function calendarForUser(authUserId: string) {
  const accessToken = await getCalendarAccessToken(authUserId);

  return calendarClient(accessToken);
}

/**
 * Maps a Google Calendar event to the compact shape exposed to the agent.
 */
function formatEvent(event: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string | null;
      uri?: string | null;
    }> | null;
  } | null;
  attendees?: Array<{
    email?: string | null;
    displayName?: string | null;
  }> | null;
}) {
  return {
    id: event.id,
    title: event.summary ?? "(no title)",
    description: event.description?.trim() || null,
    location: event.location?.trim() || null,
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    htmlLink: event.htmlLink ?? null,
    meetLink: getMeetLink(event),
    attendees: (event.attendees ?? []).map(formatAttendee).filter(isPresent),
  };
}

/**
 * Returns a Google Meet URI from the event's supported conference fields.
 */
function getMeetLink(event: {
  hangoutLink?: string | null;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string | null;
      uri?: string | null;
    }> | null;
  } | null;
}) {
  if (event.hangoutLink) {
    return event.hangoutLink;
  }

  for (const entryPoint of event.conferenceData?.entryPoints ?? []) {
    if (entryPoint.entryPointType === "video" && entryPoint.uri) {
      return entryPoint.uri;
    }
  }

  return null;
}

/**
 * Chooses the attendee email, falling back to the display name when absent.
 */
function formatAttendee(person: {
  email?: string | null;
  displayName?: string | null;
}) {
  return person.email || person.displayName || null;
}

/**
 * Narrows nullable attendee labels to the strings returned in tool results.
 */
function isPresent(value: string | null): value is string {
  return value !== null;
}

/**
 * Lists upcoming events, optionally limited to a user's calendar day.
 */
export async function listUpcomingMeetings(input: {
  authUserId: string;
  maxResults?: number;
  todayOnly?: boolean;
  timeZone?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);
  const timeZone = input.timeZone ?? "UTC";
  const now = new Date();
  const dayBounds = input.todayOnly
    ? getCalendarDayBounds(now, timeZone)
    : undefined;

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: dayBounds?.timeMin ?? now.toISOString(),
    timeMax: dayBounds?.timeMax,
    maxResults: input.maxResults ?? 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items ?? []).map(formatEvent);
}

/**
 * Creates a meeting and sends Google Calendar invitations to its attendees.
 */
export async function createMeeting(input: {
  authUserId: string;
  title: string;
  startIso: string;
  endIso: string;
  attendeeEmails?: string[];
  description?: string;
  addGoogleMeet?: boolean;
}) {
  const calendar = await calendarForUser(input.authUserId);
  const withMeet = input.addGoogleMeet !== false;
  const attendeeEmails = input.attendeeEmails ?? [];

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    conferenceDataVersion: withMeet ? 1 : undefined,
    requestBody: {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: input.startIso,
      },
      end: {
        dateTime: input.endIso,
      },
      attendees: attendeeEmails.map(toGoogleAttendee),
      conferenceData: withMeet
        ? {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          }
        : undefined,
    },
  });

  const event = formatEvent(response.data);

  return {
    ...event,
    inviteEmailsSent: attendeeEmails.length > 0,
    googleMeetAdded: event.meetLink !== null,
  };
}

/**
 * Converts an invitee email into the Google Calendar attendee request shape.
 */
function toGoogleAttendee(email: string) {
  return { email };
}

/**
 * Deletes a calendar event and asks Google to notify its attendees.
 */
export async function cancelMeeting(input: {
  authUserId: string;
  eventId: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: "all",
  });

  return {
    cancelled: true,
    eventId: input.eventId,
  };
}

/**
 * Updates an event's start and end times and notifies its attendees.
 */
export async function rescheduleMeeting(input: {
  authUserId: string;
  eventId: string;
  startIso: string;
  endIso: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: "all",
    requestBody: {
      start: {
        dateTime: input.startIso,
      },
      end: {
        dateTime: input.endIso,
      },
    },
  });

  return formatEvent(response.data);
}

/**
 * Returns busy intervals from Google Calendar for the requested time range.
 */
export async function checkCalendarBusy(input: {
  authUserId: string;
  startIso: string;
  endIso: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.startIso,
      timeMax: input.endIso,
      items: [
        {
          id: "primary",
        },
      ],
    },
  });

  const busy = response.data?.calendars?.primary?.busy ?? [];

  return {
    busy: busy.map(formatBusyInterval),
  };
}

/**
 * Normalizes an optional Google Calendar busy interval.
 */
function formatBusyInterval(item: { start?: string | null; end?: string | null }) {
  return {
    start: item.start ?? null,
    end: item.end ?? null,
  };
}
