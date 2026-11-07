import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paths } from "@/lib/paths";
import { AuthRoute } from "./auth-route";

const { replace, useSession } = vi.hoisted(() => ({
  replace: vi.fn(),
  useSession: vi.fn<
    () => { isAuthenticated: boolean; isSessionLoading: boolean }
  >(),
}));

vi.mock("@descope/nextjs-sdk/client", () => ({ useSession }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("AuthRoute", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  afterEach(cleanup);

  it("waits for the session check before rendering protected content", () => {
    useSession.mockReturnValue({
      isAuthenticated: false,
      isSessionLoading: true,
    });

    render(
      <AuthRoute mode="authenticated">
        <p>Private content</p>
      </AuthRoute>,
    );

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Checking your session",
    );
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders authenticated content when the session is valid", () => {
    useSession.mockReturnValue({
      isAuthenticated: true,
      isSessionLoading: false,
    });

    render(
      <AuthRoute mode="authenticated">
        <p>Private content</p>
      </AuthRoute>,
    );

    expect(screen.getByText("Private content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users away from protected content", async () => {
    useSession.mockReturnValue({
      isAuthenticated: false,
      isSessionLoading: false,
    });

    render(
      <AuthRoute mode="authenticated">
        <p>Private content</p>
      </AuthRoute>,
    );

    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith(paths.signIn));
  });

  it("renders the sign-in page for unauthenticated users", () => {
    useSession.mockReturnValue({
      isAuthenticated: false,
      isSessionLoading: false,
    });

    render(
      <AuthRoute mode="unauthenticated">
        <p>Sign-in content</p>
      </AuthRoute>,
    );

    expect(screen.getByText("Sign-in content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects authenticated users away from the sign-in page", async () => {
    useSession.mockReturnValue({
      isAuthenticated: true,
      isSessionLoading: false,
    });

    render(
      <AuthRoute mode="unauthenticated">
        <p>Sign-in content</p>
      </AuthRoute>,
    );

    expect(screen.queryByText("Sign-in content")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith(paths.dashboard));
  });

  it.each([
    [true, paths.dashboard],
    [false, paths.signIn],
  ])(
    "redirects from the root to %s",
    async (isAuthenticated, expectedRoute) => {
      useSession.mockReturnValue({
        isAuthenticated,
        isSessionLoading: false,
      });

      render(<AuthRoute mode="redirect" />);

      await waitFor(() => expect(replace).toHaveBeenCalledWith(expectedRoute));
    },
  );
});
