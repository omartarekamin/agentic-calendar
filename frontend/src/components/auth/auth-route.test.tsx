import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { paths } from "@/lib/paths";
import { AuthRoute } from "./auth-route";

const { redirect, session } = vi.hoisted(() => ({
  redirect: vi.fn<(path: string) => never>(),
  session: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@descope/nextjs-sdk/server", () => ({ session }));
vi.mock("next/navigation", () => ({ redirect }));

describe("AuthRoute", () => {
  beforeEach(() => {
    redirect.mockReset();
    redirect.mockImplementation((path) => {
      throw new Error(`redirect:${path}`);
    });
    session.mockReset();
  });

  it("renders authenticated content when the session is valid", async () => {
    session.mockResolvedValue({});

    render(
      await AuthRoute({
        mode: "authenticated",
        children: <p>Private content</p>,
      }),
    );

    expect(screen.getByText("Private content")).toBeInTheDocument();
  });

  it("renders the sign-in page for unauthenticated users", async () => {
    session.mockResolvedValue(undefined);

    render(
      await AuthRoute({
        mode: "unauthenticated",
        children: <p>Sign-in content</p>,
      }),
    );

    expect(screen.getByText("Sign-in content")).toBeInTheDocument();
  });

  it("redirects authenticated users away from the sign-in page", async () => {
    session.mockResolvedValue({});

    await expect(
      AuthRoute({ mode: "unauthenticated", children: <p>Sign-in content</p> }),
    ).rejects.toThrow(`redirect:${paths.dashboard}`);
    expect(redirect).toHaveBeenCalledWith(paths.dashboard);
  });

  it.each([
    [{}, paths.dashboard],
    [undefined, paths.signIn],
  ])(
    "redirects from the root to %s",
    async (sessionInfo, expectedRoute) => {
      session.mockResolvedValue(sessionInfo);

      await expect(AuthRoute({ mode: "redirect" })).rejects.toThrow(
        `redirect:${expectedRoute}`,
      );
      expect(redirect).toHaveBeenCalledWith(expectedRoute);
    },
  );
});
