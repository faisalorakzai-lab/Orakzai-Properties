import http from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { userSockets } from "./lib/ws";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* ─── HTTP server wrapping Express ─── */
const server = http.createServer(app);

/* ─── WebSocket server on /api/ws ─── */
const wss = new WebSocketServer({ server, path: "/api/ws" });

wss.on("connection", (ws) => {
  let authedUserId: string | null = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (msg["type"] === "auth" && typeof msg["userId"] === "string") {
        authedUserId = msg["userId"];
        if (!userSockets.has(authedUserId)) {
          userSockets.set(authedUserId, new Set());
        }
        userSockets.get(authedUserId)!.add(ws);
        ws.send(JSON.stringify({ event: "auth_ok", userId: authedUserId }));
        logger.info({ userId: authedUserId }, "WS: user authenticated");
      }
      if (msg["type"] === "ping") {
        ws.send(JSON.stringify({ event: "pong" }));
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on("close", () => {
    if (authedUserId) {
      userSockets.get(authedUserId)?.delete(ws);
      if (userSockets.get(authedUserId)?.size === 0) {
        userSockets.delete(authedUserId);
      }
    }
  });
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
