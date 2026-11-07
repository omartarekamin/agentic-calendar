import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paths } from "@/lib/paths";
import { DashboardContent } from "./dashboard-content";

const { logout, replace } = vi.hoisted(() => ({
  logout: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@descope/nextjs-sdk/client", () => ({
  useDescope: () => ({ logout }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("DashboardContent", () => {
  beforeEach(() => {
    logout.mockReset();
    replace.mockReset();
  });

  afterEach(cleanup);

  it("logs out and redirects to sign-in", async () => {
    logout.mockResolvedValue(undefined);
    render(<DashboardContent />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith(paths.signIn);
    });
  });

  it("displays an error if logout fails", async () => {
    logout.mockRejectedValue(new Error("Logout request failed"));
    render(<DashboardContent />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Logout failed. Please try again.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
