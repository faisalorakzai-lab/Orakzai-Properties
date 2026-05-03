import { WebSocket } from "ws";

// userId → active sockets — populated by index.ts at startup
export const userSockets = new Map<string, Set<WebSocket>>();

export function broadcastToUser(userId: string, payload: unknown): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}
