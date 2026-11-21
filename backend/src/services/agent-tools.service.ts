import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  cancelMeeting,
  checkCalendarBusy,
  createMeeting,
  listUpcomingMeetings,
  rescheduleMeeting,
} from "./calendar.service.js";

const isoDateTimeSchema = z.iso.datetime({ offset: true });

/**
 * Confirms that a meeting's end instant is later than its start instant.
 */
function hasValidTimeRange(input: { startIso: string; endIso: string }) {
  return Date.parse(input.endIso) > Date.parse(input.startIso);
}

/**
 * Confirms that Intl recognizes the requested IANA timezone identifier.
 */
function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }

    throw error;
  }
}

/**
 * Requires an explicit timezone whenever the caller requests today's events.
 */
function hasTimeZoneForToday(input: {
  todayOnly?: boolean;
  timeZone?: string;
}) {
  return !input.todayOnly || Boolean(input.timeZone);
}

/**
 * Creates calendar tools that are permanently scoped to the authenticated user.
 */
export function createCalendarTools(authUserId: string) {
  const timeRangeMessage = "The end time must be later than the start time.";
  const timeZoneSchema = z
    .string()
    .trim()
    .min(1)
    .refine(isValidTimeZone, "Provide a valid IANA timezone.");

  return {
    listUpcomingMeetings: createTool({
      id: "listUpcomingMeetings",
      description:
        "List Google Calendar events. Set todayOnly=true for today's agenda only and provide the user's saved timezone.",
      inputSchema: z
        .object({
          maxResults: z.number().int().min(1).max(20).optional(),
          todayOnly: z
            .boolean()
            .optional()
            .describe("If true, only return events for the requested calendar day"),
          timeZone: timeZoneSchema.optional(),
        })
        .strict()
        .refine(
          hasTimeZoneForToday,
          "Provide the user's timezone when requesting today's events.",
        ),
      // Fetches events only for the authenticated user captured by this factory.
      execute: async ({ maxResults, todayOnly, timeZone }) =>
        listUpcomingMeetings({
          authUserId,
          maxResults,
          todayOnly,
          timeZone,
        }),
    }),

    checkCalendarBusy: createTool({
      id: "checkCalendarBusy",
      description:
        "Check whether the user's primary Google Calendar is busy between two ISO datetimes.",
      inputSchema: z
        .object({
          startIso: isoDateTimeSchema.describe("Start time as an ISO-8601 datetime"),
          endIso: isoDateTimeSchema.describe("End time as an ISO-8601 datetime"),
        })
        .strict()
        .refine(hasValidTimeRange, timeRangeMessage),
      // Checks availability only in the authenticated user's primary calendar.
      execute: async ({ startIso, endIso }) =>
        checkCalendarBusy({
          authUserId,
          startIso,
          endIso,
        }),
    }),

    createMeeting: createTool({
      id: "createMeeting",
      description:
        "Create a Google Calendar event. Adds a Google Meet link by default and emails invitees when attendeeEmails are set.",
      inputSchema: z
        .object({
          title: z.string().trim().min(1),
          startIso: isoDateTimeSchema.describe("Start time as an ISO-8601 datetime"),
          endIso: isoDateTimeSchema.describe("End time as an ISO-8601 datetime"),
          attendeeEmails: z
            .array(z.email())
            .optional()
            .describe("Invite these email addresses; Google sends calendar invitations"),
          description: z.string().optional(),
          addGoogleMeet: z
            .boolean()
            .optional()
            .describe("Default true. Set false to skip a Google Meet link"),
        })
        .strict()
        .refine(hasValidTimeRange, timeRangeMessage),
      // Creates the requested event for the authenticated user's calendar.
      execute: async (input) =>
        createMeeting({
          authUserId,
          ...input,
        }),
    }),

    rescheduleMeeting: createTool({
      id: "rescheduleMeeting",
      description:
        "Move an existing event to a new start/end time and email invitees.",
      inputSchema: z
        .object({
          eventId: z.string().trim().min(1),
          startIso: isoDateTimeSchema.describe("Start time as an ISO-8601 datetime"),
          endIso: isoDateTimeSchema.describe("End time as an ISO-8601 datetime"),
        })
        .strict()
        .refine(hasValidTimeRange, timeRangeMessage),
      // Updates only the event identified by the given user's calendar event ID.
      execute: async (input) =>
        rescheduleMeeting({
          authUserId,
          ...input,
        }),
    }),

    cancelMeeting: createTool({
      id: "cancelMeeting",
      description:
        "Cancel a Google Calendar event by ID and email its attendees about the cancellation.",
      inputSchema: z
        .object({
          eventId: z.string().trim().min(1),
        })
        .strict(),
      // Deletes only the event identified by the given user's calendar event ID.
      execute: async ({ eventId }) =>
        cancelMeeting({
          authUserId,
          eventId,
        }),
    }),
  };
}
