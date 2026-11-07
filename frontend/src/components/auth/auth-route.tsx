"use client";

import { useSession } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { paths } from "@/lib/paths";

type AuthRouteProps = {
  mode: "authenticated" | "unauthenticated" | "redirect";
  children?: ReactNode;
};

export function AuthRoute({ mode, children }: AuthRouteProps) {
  const { isAuthenticated, isSessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (mode === "redirect") {
      router.replace(isAuthenticated ? paths.dashboard : paths.signIn);
    } else if (mode === "authenticated" && !isAuthenticated) {
      router.replace(paths.signIn);
    } else if (mode === "unauthenticated" && isAuthenticated) {
      router.replace(paths.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, mode, router]);

  const canRender =
    !isSessionLoading &&
    ((mode === "authenticated" && isAuthenticated) ||
      (mode === "unauthenticated" && !isAuthenticated));

  if (!canRender) {
    return (
      <main
        className="app-shell-bg flex min-h-svh items-center justify-center"
        role="status"
        aria-label="Checking your session"
      >
        <span className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </main>
    );
  }

  return <>{children}</>;
}
