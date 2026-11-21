import assert from "node:assert/strict";
import { test } from "node:test";

const { streamAgentReply } = await import("./agent.service.js");

test("streamAgentReply requires GROQ_API_KEY", async () => {
  const previousGroqApiKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    await assert.rejects(
      streamAgentReply({
        userId: "database-user-1",
        authUserId: "descope-user-1",
        threadId: "00000000-0000-4000-8000-000000000001",
        message: "Hello",
        onEvent() {},
      }),
      /GROQ_API_KEY is not set/,
    );
  } finally {
    if (previousGroqApiKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = previousGroqApiKey;
    }
  }
});
