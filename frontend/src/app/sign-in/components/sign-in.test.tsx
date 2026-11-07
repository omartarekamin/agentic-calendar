import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInComponent from "./sign-in";

const { authRoute } = vi.hoisted(() => ({ authRoute: vi.fn() }));

vi.mock("@/components/auth/auth-route", () => ({
  AuthRouteBoundary: ({
    children,
    mode,
  }: {
    children: ReactNode;
    mode: string;
  }) => {
    authRoute(mode);
    return <>{children}</>;
  },
}));

vi.mock("./descope-flow", () => ({
  DescopeFlow: () => <div>Authentication flow</div>,
}));

describe("SignInComponent", () => {
  beforeEach(() => {
    authRoute.mockClear();
  });

  it("guards the sign-in page for unauthenticated users", () => {
    render(<SignInComponent />);

    expect(authRoute).toHaveBeenCalledWith("unauthenticated");
  });
});
