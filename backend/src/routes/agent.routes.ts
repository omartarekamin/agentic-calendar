import { Router, type Request, type RequestHandler, type Response } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  getThreadMessages,
  listUserThreads,
  streamAgentReply,
  type StreamAgentReplyInput,
  type ThreadMessage,
  type ThreadSummary,
} from "../services/agent.service.js";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  threadId: z.uuid(),
});

const threadIdSchema = z.uuid();

interface AgentService {
  listUserThreads(authUserId: string): Promise<ThreadSummary[]>;
  getThreadMessages(
    authUserId: string,
    threadId: string,
  ): Promise<ThreadMessage[]>;
  streamAgentReply(input: StreamAgentReplyInput): Promise<void>;
}

const agentService: AgentService = {
  listUserThreads,
  getThreadMessages,
  streamAgentReply,
};

function getUserIds(
  req: Request,
  res: Response,
): { authUserId: string; databaseUserId: string } | null {
  if (!req.userId || !req.dbUserId) {
    res.status(401).json({
      error: { code: "UNAUTHENTICATED", message: "A valid session is required" },
    });
    return null;
  }

  return { authUserId: req.userId, databaseUserId: req.dbUserId };
}

export function createAgentRouter(
  service: AgentService = agentService,
  sessionMiddleware: RequestHandler = requireSession,
): Router {
  const router = Router();
  router.use(sessionMiddleware);

  router.get("/threads", async (req, res) => {
    const user = getUserIds(req, res);
    if (!user) return;

    try {
      const threads = await service.listUserThreads(user.authUserId);
      res.json({ threads });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed to list threads";
      res.status(500).json({ error: message });
    }
  });

  router.get("/threads/:threadId", async (req, res) => {
    const user = getUserIds(req, res);
    if (!user) return;

    const parsed = threadIdSchema.safeParse(req.params.threadId);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid threadId" });
      return;
    }

    try {
      const messages = await service.getThreadMessages(
        user.authUserId,
        parsed.data,
      );
      res.json({ threadId: parsed.data, messages });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed to list threads";
      res.status(500).json({ error: message });
    }
  });

  router.post("/chat", async (req, res) => {
    const user = getUserIds(req, res);
    if (!user) return;

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid chat body" });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const write = (event: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      await service.streamAgentReply({
        userId: user.databaseUserId,
        authUserId: user.authUserId,
        threadId: parsed.data.threadId,
        message: parsed.data.message,
        onEvent: write,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed to list threads";
      write({ type: "error", message });
    } finally {
      res.end();
    }
  });

  return router;
}
