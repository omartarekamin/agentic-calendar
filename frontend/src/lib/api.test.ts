import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  refreshCalendarConnectionStatus,
  startCalendarConnection,
} from "./api";

const fetchMock = vi.fn<typeof fetch>();

describe("calendar connection API", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts a calendar connection with the session bearer token", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          calendarConnection: {
            id: "google-calendar",
            name: "Google Calendar",
            status: "pending",
          },
        }),
        { status: 200 },
      ),
    );

    await expect(startCalendarConnection("test-session-token")).resolves.toEqual(
      {
        id: "google-calendar",
        name: "Google Calendar",
        status: "pending",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/connections/connect",
      {
        method: "POST",
        headers: { Authorization: "Bearer test-session-token" },
      },
    );
  });

  it("refreshes and returns the calendar connection status", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          calendarConnection: {
            id: "google-calendar",
            name: "Google Calendar",
            status: "connected",
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      refreshCalendarConnectionStatus("test-session-token"),
    ).resolves.toEqual({
      id: "google-calendar",
      name: "Google Calendar",
      status: "connected",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/connections/refresh-status",
      {
        method: "POST",
        headers: { Authorization: "Bearer test-session-token" },
      },
    );
  });

  it("surfaces API errors", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "UNAUTHENTICATED", message: "A valid session is required" },
        }),
        { status: 401 },
      ),
    );

    await expect(
      refreshCalendarConnectionStatus("test-session-token"),
    ).rejects.toThrow("A valid session is required");
  });
});
