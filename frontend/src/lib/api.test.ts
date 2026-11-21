import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  listAgentThreads,
  loadAgentThread,
  refreshCalendarConnectionStatus,
  startCalendarConnection,
  streamAgentChat,
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

  it("lists agent threads with the session bearer token", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          threads: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              title: "Planning",
              updatedAt: "2026-11-21T12:00:00.000Z",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(listAgentThreads("test-session-token")).resolves.toEqual([
      {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Planning",
        updatedAt: "2026-11-21T12:00:00.000Z",
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/agents/threads",
      {
        method: "GET",
        headers: { Authorization: "Bearer test-session-token" },
      },
    );
  });

  it("loads an agent thread at the protected thread URL", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          threadId: "00000000-0000-4000-8000-000000000001",
          messages: [
            {
              id: "message-1",
              role: "user",
              content: "What do I have on Friday?",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      loadAgentThread(
        "test-session-token",
        "00000000-0000-4000-8000-000000000001",
      ),
    ).resolves.toMatchObject({
      threadId: "00000000-0000-4000-8000-000000000001",
      messages: [
        {
          id: "message-1",
          role: "user",
          content: "What do I have on Friday?",
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/agents/threads/00000000-0000-4000-8000-000000000001",
      {
        method: "GET",
        headers: { Authorization: "Bearer test-session-token" },
      },
    );
  });

  it("streams agent chat server-sent events", async () => {
    const encoder = new TextEncoder();
    fetchMock.mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                'data: {"type":"started","message":"Planning"}\n\n',
              ),
            );
            controller.enqueue(
              encoder.encode('data: {"type":"token","token":"Hello"}\n\n'),
            );
            controller.close();
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        },
      ),
    );
    const events: unknown[] = [];

    await streamAgentChat(
      "test-session-token",
      {
        message: "What is on my calendar?",
        threadId: "00000000-0000-4000-8000-000000000001",
      },
      (event) => events.push(event),
    );

    expect(events).toEqual([
      { type: "started", message: "Planning" },
      { type: "token", token: "Hello" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/agents/chat",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-session-token",
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: "What is on my calendar?",
          threadId: "00000000-0000-4000-8000-000000000001",
        }),
      },
    );
  });
});
