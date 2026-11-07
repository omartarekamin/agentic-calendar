import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignInComponent from "./sign-in";

vi.mock("@/components/auth/auth-route", () => ({
  AuthRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./descope-flow", () => ({
  DescopeFlow: () => <div>Authentication flow</div>,
}));

describe("SignInComponent", () => {
  it("explains the planned calendar assistant capabilities", () => {
    render(<SignInComponent />);

    expect(
      screen.getByRole("heading", { name: /plan meetings by simply asking/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("What we’re building")).toBeInTheDocument();
    expect(
      screen.getByText("Keep Google Calendar in sync"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage meetings by asking"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bring everyone together"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pick up where you left off"),
    ).toBeInTheDocument();
    expect(screen.getByText("Built for AI workflows")).toBeInTheDocument();
    expect(
      screen.getByText(/external AI clients through MCP/i),
    ).toBeInTheDocument();
  });
});
