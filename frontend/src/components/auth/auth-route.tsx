import { session } from "@descope/nextjs-sdk/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { paths } from "@/lib/paths";

type AuthRouteProps = {
  mode: "authenticated" | "unauthenticated" | "redirect";
  children?: ReactNode;
};

export function AuthRouteBoundary(props: AuthRouteProps) {
  return (
    <Suspense fallback={<AuthRouteFallback />}>
      <AuthRoute {...props} />
    </Suspense>
  );
}

export async function AuthRoute({ mode, children }: AuthRouteProps) {
  const isAuthenticated = Boolean(await session());

  if (mode === "redirect") {
    redirect(isAuthenticated ? paths.dashboard : paths.signIn);
  }

  if (mode === "authenticated" && !isAuthenticated) {
    redirect(paths.signIn);
  }

  if (mode === "unauthenticated" && isAuthenticated) {
    redirect(paths.dashboard);
  }

  return <>{children}</>;
}

function AuthRouteFallback() {
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
