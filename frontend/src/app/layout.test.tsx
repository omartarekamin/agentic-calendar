import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({ variable: "font-sans" }),
  Source_Serif_4: () => ({ variable: "font-heading" }),
}));

vi.mock("@descope/nextjs-sdk", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-auth-provider>{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("renders the auth provider inside the document body", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>Dashboard</main>
      </RootLayout>,
    );

    expect(markup.startsWith("<html")).toBe(true);
    expect(markup.indexOf("<body")).toBeLessThan(
      markup.indexOf("<div data-auth-provider"),
    );
    expect(markup).toContain("<main>Dashboard</main>");
  });
});
