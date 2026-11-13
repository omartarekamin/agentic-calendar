import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardContent } from "./dashboard-content";

const {
  calendarState,
  connectCalendar,
  logout,
  refreshStatus,
  replace,
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
  },
  connectCalendar: vi.fn(),
  logout: vi.fn(),
  refreshStatus: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@descope/nextjs-sdk/client", () => ({
  useDescope: () => ({ logout }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/hooks/use-calendar-connection", () => ({
  useCalendarConnection: () => calendarState,
}));

describe("DashboardContent", () => {
  beforeEach(() => {
    logout.mockReset();
    replace.mockReset();
    connectCalendar.mockReset();
    refreshStatus.mockReset();
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
  });

  afterEach(cleanup);

  it("renders the assistant layout with chat controls disabled", () => {
    render(<DashboardContent />);

    expect(
      screen.getByRole("heading", { name: "Meeting Assistant" }),
    ).toBeInTheDocument();
    expect(screen.getByText("What's on today?")).toBeInTheDocument();
    expect(screen.getByLabelText("Calendar chat composer")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "New Chat" }),
    ).not.toBeInTheDocument();
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
