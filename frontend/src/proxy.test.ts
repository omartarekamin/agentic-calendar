import { beforeEach, describe, expect, it, vi } from "vitest";
import { paths } from "@/lib/paths";

const { authMiddleware } = vi.hoisted(() => ({
  authMiddleware: vi.fn(() => vi.fn()),
}));

vi.mock("@descope/nextjs-sdk/server", () => ({ authMiddleware }));

describe("auth proxy", () => {
  beforeEach(() => {
    authMiddleware.mockClear();
  });

  it("requires a valid session before rendering dashboard routes", async () => {
    const { config } = await import("./proxy");

    expect(authMiddleware).toHaveBeenCalledWith({
      privateRoutes: [paths.dashboard, paths.connectionTest],
      redirectUrl: paths.signIn,
      skipRefreshTokenValidation: true,
    });
    expect(config.matcher).toEqual([
      "/dashboard/:path*",
      "/connection-test/:path*",
    ]);
  });
});
