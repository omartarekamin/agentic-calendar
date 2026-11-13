import { describe, expect, it } from "vitest";
import { paths } from "./paths";

describe("paths", () => {
  it("defines the main frontend navigation paths", () => {
    expect(paths).toEqual({
      home: "/",
      signIn: "/sign-in",
      dashboard: "/dashboard",
      connectionTest: "/connection-test",
    });
  });
});
