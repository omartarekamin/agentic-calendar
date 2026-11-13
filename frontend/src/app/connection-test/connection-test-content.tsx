"use client";

import { useCalendarConnection } from "@/hooks/use-calendar-connection";

export function ConnectionTestContent() {
  const {
    calendarConnection,
    connectionError,
    handleConnectCalendar,
    handleRefreshConnectionStatus,
    isAuthenticated,
    isCheckingConnection,
    isSessionLoading,
  } = useCalendarConnection();

  return (
    <main className="app-shell-bg min-h-svh px-5 py-10 sm:px-8">
      <section className="mx-auto max-w-2xl rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Agentic Calendar
        </p>
        <h1 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
          Google Calendar connection test
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Start the connection to open Google consent. After completing consent,
          approve Google&apos;s requested permissions and return to this page;
          the connection status will be checked automatically. A connected
          status confirms Descope stored the user&apos;s token. Request details
          are logged in the browser console without session tokens or the
          authorization URL.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConnectCalendar}
            disabled={
              isSessionLoading || !isAuthenticated || isCheckingConnection
            }
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCheckingConnection
              ? "Connecting..."
              : "Start Google Calendar connection"}
          </button>
          <button
            type="button"
            onClick={handleRefreshConnectionStatus}
            disabled={
              isSessionLoading || !isAuthenticated || isCheckingConnection
            }
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh connection status
          </button>
        </div>

        <p aria-live="polite" className="mt-5 text-sm">
          {calendarConnection
            ? `Google Calendar status: ${calendarConnection.status}`
            : "No connection status checked yet."}
        </p>
        {connectionError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {connectionError}
          </p>
        )}
      </section>
    </main>
  );
}
