"use client";

import { useDescope } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { paths } from "@/lib/paths";

export function DashboardContent() {
  const sdk = useDescope();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      await sdk.logout();
      router.replace(paths.signIn);
    } catch {
      setError("Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <main>
      <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
