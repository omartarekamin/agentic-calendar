"use client";

import { useDescope } from "@descope/nextjs-sdk/client";
import {
  ArrowUp,
  CalendarDays,
  LogOut,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCalendarConnection } from "@/hooks/use-calendar-connection";
import { paths } from "@/lib/paths";

const suggestedPrompts = [
  "What's on today?",
  "Find a free slot tomorrow morning",
  "Create a 30-min sync with Meet",
];

export function DashboardContent() {
  const sdk = useDescope();
  const router = useRouter();
  const {
    calendarConnection,
    connectionError,
    handleConnectCalendar,
    handleRefreshConnectionStatus,
    isAuthenticated,
    isCheckingConnection,
    isSessionLoading,
  } = useCalendarConnection();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await sdk.logout();
      router.replace(paths.signIn);
    } catch {
      setLogoutError("Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  const isConnected = calendarConnection?.status === "connected";
  const connectionStatus = isCheckingConnection
    ? "Checking..."
    : calendarConnection?.status === "connected"
      ? "Connected"
      : calendarConnection?.status === "pending"
        ? "Connection pending"
        : "Not connected";
  const isConnectionActionDisabled =
    isSessionLoading || !isAuthenticated || isCheckingConnection;

  return (
    <main className="flex min-h-svh flex-col bg-background md:h-svh md:flex-row md:overflow-hidden">
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card md:h-svh md:w-56 md:border-b-0 md:border-r">
        <div className="p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">Meet Agent</span>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
            <Plus aria-hidden="true" className="size-4" />
            <span>New Chat</span>
          </div>
        </div>

        <section className="px-3 pb-4" aria-labelledby="connections-heading">
          <h2
            id="connections-heading"
            className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Connections
          </h2>
          <div className="rounded-xl border border-border/70 bg-background/70 p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  Google Calendar
                </p>
                <p aria-live="polite" className="text-[11px] text-muted-foreground">
                  {connectionStatus}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnectCalendar}
                disabled={isConnectionActionDisabled}
                aria-label={
                  isConnected
                    ? "Reconnect Google Calendar"
                    : "Connect Google Calendar"
                }
                className="rounded-md px-1.5 py-1 text-[11px] font-medium text-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingConnection
                  ? "Working..."
                  : isConnected
                    ? "Reconnect"
                    : "Connect"}
              </button>
              <button
                type="button"
                onClick={handleRefreshConnectionStatus}
                disabled={isConnectionActionDisabled}
                aria-label="Refresh Google Calendar status"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw aria-hidden="true" className="size-3.5" />
              </button>
            </div>
            {connectionError && (
              <p role="alert" className="mt-2 break-words text-xs text-destructive">
                {connectionError}
              </p>
            )}
          </div>
        </section>

        <section
          className="min-h-20 flex-1 border-t border-border/70 px-4 py-4 md:min-h-0"
          aria-labelledby="chats-heading"
        >
          <h2
            id="chats-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Chats
          </h2>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            No chats yet. Chat is coming soon.
          </p>
        </section>

        <footer className="border-t border-border px-4 py-3">
          <p className="truncate text-xs text-muted-foreground">Signed in</p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut aria-hidden="true" className="size-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
          {logoutError && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {logoutError}
            </p>
          )}
        </footer>
      </aside>

      <div className="app-shell-bg flex min-h-[65svh] min-w-0 flex-1 flex-col md:h-svh md:min-h-0">
        <header className="border-b border-border/70 bg-background/70 px-5 py-3">
          <h1 className="text-sm font-semibold">Assistant</h1>
          <p className="text-xs text-muted-foreground">
            Your Google Calendar assistant
          </p>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground">
            <Sparkles aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight">
            Meeting Assistant
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Connect Google Calendar, then ask about today&apos;s agenda, create a
            Meet, or reschedule something.
          </p>
          <div className="mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {suggestedPrompts.map((prompt) => (
              <span
                key={prompt}
                className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground"
              >
                {prompt}
              </span>
            ))}
          </div>
        </section>

        <div className="border-t border-border/70 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-xl items-end gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-sm">
            <textarea
              aria-label="Calendar chat composer"
              disabled
              placeholder="Chat is coming soon..."
              rows={1}
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              aria-label="Send message"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground opacity-60"
            >
              <ArrowUp aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
