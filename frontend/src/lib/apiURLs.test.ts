import { describe, expect, it } from "vitest";
import { createApiURLs } from "./apiURLs";

describe("createApiURLs", () => {
  it("builds backend endpoint URLs from the base URL", () => {
    expect(createApiURLs("https://api.example.com")).toEqual({
      health: "https://api.example.com/health",
      events: "https://api.example.com/api/events",
      chat: "https://api.example.com/api/chat",
    });
  });

  it("removes trailing slashes from the base URL", () => {
    expect(createApiURLs("https://api.example.com///").health).toBe(
      "https://api.example.com/health",
    );
  });
});
