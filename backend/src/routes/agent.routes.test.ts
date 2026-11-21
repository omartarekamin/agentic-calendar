import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import express, { type RequestHandler } from "express";

const { createAgentRouter } = await import("./agent.routes.js");

async function startServer(app: express.Express): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not start on a TCP port");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}

const fakeSession: RequestHandler = (req, _res, next) => {
  req.userId = "descope-user-1";
  req.dbUserId = "database-user-1";
  next();
};

test("GET /threads uses the authenticated Descope user", async () => {
  const app = express();
  app.use(
    "/api/agents",
    createAgentRouter(
      {
        async listUserThreads(authUserId) {
          assert.equal(authUserId, "descope-user-1");
          return [{
            id: "00000000-0000-4000-8000-000000000001",
            title: "Planning",
            updatedAt: "2026-11-21T12:00:00.000Z",
          }];
        },
        async getThreadMessages() {
          return [];
        },
        async streamAgentReply() {},
      },
      fakeSession,
    ),
  );
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/api/agents/threads`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).threads[0].title, "Planning");
  } finally {
    await server.close();
  }
});

test("POST /chat passes both authenticated user IDs to the agent", async () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/agents",
    createAgentRouter(
      {
        async listUserThreads() {
          return [];
        },
        async getThreadMessages() {
          return [];
        },
        async streamAgentReply(input) {
          assert.equal(input.userId, "database-user-1");
          assert.equal(input.authUserId, "descope-user-1");
          assert.equal(input.threadId, "00000000-0000-4000-8000-000000000001");
          input.onEvent({ type: "token", token: "Hello" });
          input.onEvent({ type: "completed", message: "done" });
        },
      },
      fakeSession,
    ),
  );
  const server = await startServer(app);

  try {
    const response = await fetch(`${server.url}/api/agents/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is on my calendar?",
        threadId: "00000000-0000-4000-8000-000000000001",
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type"),
      "text/event-stream",
    );
    const body = await response.text();
    assert.match(body, /"token":"Hello"/);
  } finally {
    await server.close();
  }
});
