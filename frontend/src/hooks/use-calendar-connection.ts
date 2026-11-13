"use client";

import { useDescope, useSession } from "@descope/nextjs-sdk/client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  refreshCalendarConnectionStatus,
  startCalendarConnection,
  type CalendarConnection,
} from "@/lib/api";
import { redirectToAuthorizationUrl } from "@/lib/oauth-navigation";

export function useCalendarConnection() {
  const sdk = useDescope();
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [calendarConnection, setCalendarConnection] =
    useState<CalendarConnection | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const checkedSessionToken = useRef<string | null>(null);

  const handleRefreshConnectionStatus = useCallback(async () => {
    setConnectionError(null);

    if (!sessionToken) {
      const message = "The Descope session token is not available.";
      console.error("[calendar-connection] Status refresh failed:", message);
      setConnectionError(message);
      return;
    }

    setIsCheckingConnection(true);
    console.info(
      "[calendar-connection] Starting POST /api/connections/refresh-status",
    );

    try {
      const result = await refreshCalendarConnectionStatus(sessionToken);
      setCalendarConnection(result);
      console.info("[calendar-connection] Connection status refreshed", {
        status: result.status,
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "The connection status check failed.";
      console.error("[calendar-connection] Status refresh failed:", message);
      setConnectionError(message);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (isSessionLoading || !isAuthenticated || !sessionToken) {
      return;
    }

    const returnUrl = new URL(window.location.href);
    if (returnUrl.searchParams.get("calendarConnection") === "complete") {
      returnUrl.searchParams.delete("calendarConnection");
      window.history.replaceState(
        window.history.state,
        "",
        `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`,
      );
      checkedSessionToken.current = sessionToken;
      void handleRefreshConnectionStatus();
      return;
    }

    if (checkedSessionToken.current === sessionToken) {
      return;
    }

    checkedSessionToken.current = sessionToken;
    void handleRefreshConnectionStatus();
  }, [
    handleRefreshConnectionStatus,
    isAuthenticated,
    isSessionLoading,
    sessionToken,
  ]);

  const handleConnectCalendar = useCallback(async () => {
    setConnectionError(null);

    if (!sessionToken) {
      const message = "The Descope session token is not available.";
      console.error("[calendar-connection] Connection request failed:", message);
      setConnectionError(message);
      return;
    }

    setIsCheckingConnection(true);
    console.info("[calendar-connection] Starting Google Calendar consent");

    try {
      const connection = await startCalendarConnection(sessionToken);
      setCalendarConnection(connection);
      const redirectUrl = new URL(window.location.href);
      redirectUrl.searchParams.set("calendarConnection", "complete");
      const result = await sdk.outbound.connect(connection.id, {
        redirectUrl: redirectUrl.toString(),
      });

      if (result.error) {
        const { errorCode, errorDescription, traceId } = result.error;
        console.error("[calendar-connection] Descope outbound connection failed", {
          code: errorCode,
          description: errorDescription,
          traceId,
        });
        const details = errorDescription
          ? `: ${errorDescription}`
          : ". Confirm the app exists under Descope Connect > Outbound Apps in this project, not under Connections, and verify its Google OAuth settings.";
        const trace = traceId ? ` (trace ID: ${traceId})` : "";
        throw new Error(
          `Google Calendar consent could not be started (Descope ${errorCode})${details}${trace}`,
        );
      }

      const authorizationUrl = result.data?.url;
      if (!authorizationUrl) {
        throw new Error(
          "Descope did not return a Google Calendar authorization URL.",
        );
      }

      console.info("[calendar-connection] Google Calendar consent started", {
        status: connection.status,
      });
      redirectToAuthorizationUrl(authorizationUrl);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "The connection request failed.";
      console.error("[calendar-connection] Connection failed:", message);
      setConnectionError(message);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [sdk, sessionToken]);

  return {
    calendarConnection,
    connectionError,
    handleConnectCalendar,
    handleRefreshConnectionStatus,
    isAuthenticated,
    isCheckingConnection,
    isSessionLoading,
    sessionToken,
  };
}
