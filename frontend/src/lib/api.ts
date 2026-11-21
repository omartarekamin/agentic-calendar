import { apiURLs } from "./apiURLs";

export type CalendarConnectionStatus =
  | "connected"
  | "disconnected"
  | "pending";

export type AgentStreamEvent = {
  type: "started" | "progress" | "token" | "completed" | "error";
  message?: string;
  token?: string;
};

export type ThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

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

  return `Request failed (${status}).`;
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

async function getProtectedRequest(
  url: string,
  sessionToken: string,
): Promise<unknown> {
  if (!sessionToken) {
    throw new Error("The Descope session token is not available.");
  }

  const response = await fetch(url, {
    method: "GET",
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

export async function listAgentThreads(
  sessionToken: string,
): Promise<ThreadSummary[]> {
  const payload = await getProtectedRequest(apiURLs.agentThreads, sessionToken);

  if (!isRecord(payload) || !Array.isArray(payload.threads)) {
    throw new Error("Unexpected agent threads response.");
  }

  return payload.threads.map((thread) => {
    if (
      !isRecord(thread) ||
      typeof thread.id !== "string" ||
      typeof thread.title !== "string" ||
      typeof thread.updatedAt !== "string"
    ) {
      throw new Error("Unexpected agent threads response.");
    }

    return {
      id: thread.id,
      title: thread.title,
      updatedAt: thread.updatedAt,
    };
  });
}

export async function loadAgentThread(
  sessionToken: string,
  threadId: string,
): Promise<{ threadId: string; messages: ThreadMessage[] }> {
  const payload = await getProtectedRequest(
    `${apiURLs.agentThread}/${encodeURIComponent(threadId)}`,
    sessionToken,
  );

  if (
    !isRecord(payload) ||
    typeof payload.threadId !== "string" ||
    !Array.isArray(payload.messages)
  ) {
    throw new Error("Unexpected agent thread response.");
  }

  const messages = payload.messages.map((message) => {
    if (!isRecord(message) || typeof message.id !== "string") {
      throw new Error("Unexpected agent thread response.");
    }

    let role: ThreadMessage["role"];
    if (
      message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system"
    ) {
      role = message.role;
    } else {
      throw new Error("Unexpected agent thread response.");
    }

    if (typeof message.content !== "string") {
      throw new Error("Unexpected agent thread response.");
    }

    return {
      id: message.id,
      role,
      content: message.content,
    };
  });

  return {
    threadId: payload.threadId,
    messages,
  };
}

export async function streamAgentChat(
  sessionToken: string,
  input: { message: string; threadId: string },
  onEvent: (event: AgentStreamEvent) => void,
): Promise<void> {
  if (!sessionToken) {
    throw new Error("The Descope session token is not available.");
  }

  const response = await fetch(apiURLs.agentChat, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload: unknown = await response.json();
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (!response.body) {
    throw new Error("Agent request failed");
  }

  // Read the Server-Sent Event stream incrementally instead of waiting for it to finish.
  const reader = response.body.getReader();
  // The stream reader yields Uint8Array byte chunks, not JavaScript strings.
  // Decode those bytes as UTF-8 text while preserving incomplete characters between chunks.
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    // A blank line separates complete SSE events; retain a partial final event.
    const blocks = buffer.split(/\r?\n\r?\n/);
    // The final block may be incomplete, so keep it for the next read.
    buffer = blocks.pop() ?? "";

    // Process complete SSE event blocks and their individual lines.
    for (const block of blocks) {
      for (const line of block.split(/\r?\n/)) {
        // SSE metadata such as event or id lines is ignored; data lines contain JSON.
        if (!line.startsWith("data:")) continue;

        // Remove the data prefix and whitespace, then parse and deliver the event.
        const data = line.slice(5).trim();
        if (data) {
          onEvent(JSON.parse(data) as AgentStreamEvent);
        }
      }
    }

    if (done) break;
  }
}
