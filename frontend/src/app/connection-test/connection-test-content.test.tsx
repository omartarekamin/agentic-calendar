import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectionTestContent } from "./connection-test-content";

const {
  outboundConnect,
  refreshCalendarConnectionStatus,
  redirectToAuthorizationUrl,
  session,
  startCalendarConnection,
} = vi.hoisted(() => ({
  outboundConnect: vi.fn(),
  refreshCalendarConnectionStatus: vi.fn(),
  redirectToAuthorizationUrl: vi.fn(),
  session: { sessionToken: "test-session-token" },
  startCalendarConnection: vi.fn(),
}));

vi.mock("@descope/nextjs-sdk/client", () => ({
  useDescope: () => ({ outbound: { connect: outboundConnect } }),
  useSession: () => ({
    isAuthenticated: true,
    isSessionLoading: false,
    sessionToken: session.sessionToken,
  }),
}));

vi.mock("@/lib/api", () => ({
  refreshCalendarConnectionStatus,
  startCalendarConnection,
}));

vi.mock("@/lib/oauth-navigation", () => ({
  redirectToAuthorizationUrl,
}));

describe("ConnectionTestContent", () => {
  beforeEach(() => {
    outboundConnect.mockReset();
    refreshCalendarConnectionStatus.mockReset();
    redirectToAuthorizationUrl.mockReset();
    startCalendarConnection.mockReset();
    session.sessionToken = "test-session-token";
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("starts Google consent through the authenticated Descope frontend SDK", async () => {
    startCalendarConnection.mockResolvedValue({
      id: "google-calendar",
      name: "Google Calendar",
      status: "pending",
    });
    outboundConnect.mockResolvedValue({
      ok: true,
      data: { url: "https://descope.example/authorize" },
    });
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    render(<ConnectionTestContent />);
    fireEvent.click(
      screen.getByRole("button", { name: "Start Google Calendar connection" }),
    );

    await waitFor(() => {
      expect(outboundConnect).toHaveBeenCalledWith("google-calendar", {
        redirectUrl: expect.stringContaining(
          "calendarConnection=complete",
        ),
      });
    });
    expect(startCalendarConnection).toHaveBeenCalledWith("test-session-token");
    expect(redirectToAuthorizationUrl).toHaveBeenCalledWith(
      "https://descope.example/authorize",
    );
    expect(screen.getByText("Google Calendar status: pending")).toBeInTheDocument();
    expect(infoSpy).toHaveBeenCalledWith(
      "[calendar-test] Google Calendar consent started",
      { status: "pending" },
    );
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain(
      "test-session-token",
    );
    infoSpy.mockRestore();
  });

  it("refreshes connection status after returning from Google consent", async () => {
    window.history.replaceState(
      {},
      "",
      "/connection-test?calendarConnection=complete",
    );
    refreshCalendarConnectionStatus.mockResolvedValue({
      id: "google-calendar",
      name: "Google Calendar",
      status: "connected",
    });

    render(<ConnectionTestContent />);

    expect(
      await screen.findByText("Google Calendar status: connected"),
    ).toBeInTheDocument();
    expect(refreshCalendarConnectionStatus).toHaveBeenCalledWith(
      "test-session-token",
    );
    expect(window.location.search).toBe("");
  });

  it("displays Descope errors returned by the browser SDK", async () => {
    startCalendarConnection.mockResolvedValue({
      id: "google-calendar",
      name: "Google Calendar",
      status: "pending",
    });
    outboundConnect.mockResolvedValue({
      ok: false,
      error: {
        errorCode: "E151101",
        errorDescription: "Outbound app was not found",
        traceId: "trace-123",
      },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ConnectionTestContent />);
    fireEvent.click(
      screen.getByRole("button", { name: "Start Google Calendar connection" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Google Calendar consent could not be started (Descope E151101): Outbound app was not found (trace ID: trace-123)",
    );
  });

  it("refreshes and displays the Google Calendar connection status", async () => {
    refreshCalendarConnectionStatus.mockResolvedValue({
      id: "google-calendar",
      name: "Google Calendar",
      status: "connected",
    });

    render(<ConnectionTestContent />);
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh connection status" }),
    );

    expect(
      await screen.findByText("Google Calendar status: connected"),
    ).toBeInTheDocument();
    expect(refreshCalendarConnectionStatus).toHaveBeenCalledWith(
      "test-session-token",
    );
  });

  it("shows a connection API error", async () => {
    startCalendarConnection.mockRejectedValue(
      new Error("A valid session is required"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ConnectionTestContent />);
    fireEvent.click(
      screen.getByRole("button", { name: "Start Google Calendar connection" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A valid session is required",
    );
  });
});
