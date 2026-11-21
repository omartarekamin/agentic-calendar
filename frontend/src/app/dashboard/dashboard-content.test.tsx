import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardContent } from "./dashboard-content";
import type { AgentStreamEvent } from "@/lib/api";

const {
  calendarState,
  connectCalendar,
  listAgentThreads,
  loadAgentThread,
  logout,
  refreshStatus,
  replace,
  streamAgentChat,
} = vi.hoisted(() => ({
  calendarState: {
    calendarConnection: {
      id: "google-calendar",
      name: "Google Calendar",
      status: "connected" as "connected" | "disconnected" | "pending",
    },
    connectionError: null as string | null,
    handleConnectCalendar: vi.fn(),
    handleRefreshConnectionStatus: vi.fn(),
    isAuthenticated: true,
    isCheckingConnection: false,
    isSessionLoading: false,
    sessionToken: "test-session-token",
  },
  connectCalendar: vi.fn(),
  listAgentThreads: vi.fn(),
  loadAgentThread: vi.fn(),
  logout: vi.fn(),
  refreshStatus: vi.fn(),
  replace: vi.fn(),
  streamAgentChat: vi.fn(),
}));

vi.mock("@descope/nextjs-sdk/client", () => ({
  useDescope: () => ({ logout }),
  useSession: () => ({
    isAuthenticated: true,
    isSessionLoading: false,
    sessionToken: "test-session-token",
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/hooks/use-calendar-connection", () => ({
  useCalendarConnection: () => calendarState,
}));

vi.mock("@/lib/api", () => ({
  listAgentThreads,
  loadAgentThread,
  streamAgentChat,
}));

describe("DashboardContent", () => {
  beforeEach(() => {
    logout.mockReset();
    replace.mockReset();
    connectCalendar.mockReset();
    refreshStatus.mockReset();
    listAgentThreads.mockReset();
    loadAgentThread.mockReset();
    streamAgentChat.mockReset();
    listAgentThreads.mockResolvedValue([]);
    loadAgentThread.mockResolvedValue({
      threadId: "00000000-0000-4000-8000-000000000001",
      messages: [],
    });
    streamAgentChat.mockResolvedValue(undefined);
    calendarState.calendarConnection = {
      id: "google-calendar",
      name: "Google Calendar",
      status: "connected",
    };
    calendarState.connectionError = null;
    calendarState.handleConnectCalendar = connectCalendar;
    calendarState.handleRefreshConnectionStatus = refreshStatus;
    calendarState.isAuthenticated = true;
    calendarState.isCheckingConnection = false;
    calendarState.isSessionLoading = false;
    calendarState.sessionToken = "test-session-token";
  });

  afterEach(cleanup);

  it("renders the assistant layout with chat controls enabled", () => {
    render(<DashboardContent />);

    expect(
      screen.getByRole("heading", { name: "Meeting Assistant" }),
    ).toBeInTheDocument();
    expect(screen.getByText("What's on today?")).toBeInTheDocument();
    expect(screen.getByLabelText("Calendar chat composer")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New Chat" })).toBeInTheDocument();
  });

  it("loads threads and sends a streamed message", async () => {
    listAgentThreads.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Planning",
        updatedAt: "2026-11-21T12:00:00.000Z",
      },
    ]);
    streamAgentChat.mockImplementation(
      async (
        _token: string,
        _input: { message: string; threadId: string },
        onEvent: (event: AgentStreamEvent) => void,
      ) => {
        onEvent({ type: "started", message: "Agent is planning" });
        onEvent({ type: "token", token: "You have " });
        onEvent({ type: "token", token: "a meeting." });
        onEvent({ type: "completed", message: "done" });
      },
    );

    render(<DashboardContent />);

    expect(await screen.findByRole("button", { name: "Planning" })).toBeInTheDocument();
    const composer = screen.getByLabelText("Calendar chat composer");
    fireEvent.change(composer, { target: { value: "What's on today?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(document.body).toHaveTextContent("You have a meeting.");
    });
    expect(streamAgentChat).toHaveBeenCalledWith(
      "test-session-token",
      expect.objectContaining({
        message: "What's on today?",
        threadId: expect.any(String),
      }),
      expect.any(Function),
    );
  });

  it("restores the most recently updated conversation when the dashboard opens", async () => {
    listAgentThreads.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Planning",
        updatedAt: "2026-11-21T12:00:00.000Z",
      },
    ]);
    loadAgentThread.mockResolvedValue({
      threadId: "00000000-0000-4000-8000-000000000001",
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: "Your saved conversation is back.",
        },
      ],
    });

    render(<DashboardContent />);

    expect(
      await screen.findByText("Your saved conversation is back."),
    ).toBeInTheDocument();
    expect(loadAgentThread).toHaveBeenCalledWith(
      "test-session-token",
      "00000000-0000-4000-8000-000000000001",
    );
  });

  it("renders loaded assistant messages as markdown", async () => {
    listAgentThreads.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Planning",
        updatedAt: "2026-11-21T12:00:00.000Z",
      },
    ]);
    loadAgentThread.mockResolvedValue({
      threadId: "00000000-0000-4000-8000-000000000001",
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: "## Your agenda\n\n- **Project sync** at 10:00",
        },
      ],
    });

    render(<DashboardContent />);

    fireEvent.click(await screen.findByRole("button", { name: "Planning" }));

    expect(await screen.findByRole("heading", { name: "Your agenda" })).toBeInTheDocument();
    expect(screen.getByText("Project sync")).toBeInTheDocument();
  });

  it("keeps the conversation scroll area constrained with the composer available", async () => {
    listAgentThreads.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000001",
        title: "Planning",
        updatedAt: "2026-11-21T12:00:00.000Z",
      },
    ]);
    loadAgentThread.mockResolvedValue({
      threadId: "00000000-0000-4000-8000-000000000001",
      messages: [
        {
          id: "assistant-long",
          role: "assistant",
          content: "A long response ".repeat(100),
        },
      ],
    });

    render(<DashboardContent />);

    const scrollArea = await screen.findByText(/A long response/);
    const historyPanel = scrollArea.closest('[data-slot="scroll-area"]');

    expect(historyPanel).toHaveClass("min-h-0");
    expect(screen.getByLabelText("Calendar chat composer")).toBeInTheDocument();
  });

  it("exposes calendar connect and status refresh actions", () => {
    render(<DashboardContent />);

    fireEvent.click(
      screen.getByRole("button", { name: "Reconnect Google Calendar" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh Google Calendar status" }),
    );

    expect(connectCalendar).toHaveBeenCalledOnce();
    expect(refreshStatus).toHaveBeenCalledOnce();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows a connect action when Google Calendar is disconnected", () => {
    calendarState.calendarConnection = {
      id: "google-calendar",
      name: "Google Calendar",
      status: "disconnected",
    };
    render(<DashboardContent />);

    expect(
      screen.getByRole("button", { name: "Connect Google Calendar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("logs out and redirects to sign-in", async () => {
    logout.mockResolvedValue(undefined);
    render(<DashboardContent />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith("/sign-in");
    });
  });

  it("displays an error if logout fails", async () => {
    logout.mockRejectedValue(new Error("Logout request failed"));
    render(<DashboardContent />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Logout failed. Please try again.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("displays calendar connection errors", () => {
    calendarState.connectionError = "Calendar consent failed.";
    render(<DashboardContent />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Calendar consent failed.",
    );
  });
});
