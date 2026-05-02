import type { Response } from "express";

class SSEController {
  private clients = new Map<number, Set<Response>>();

  subscribe(projectId: number, res: Response) {
    if (!this.clients.has(projectId)) {
      this.clients.set(projectId, new Set());
    }
    this.clients.get(projectId)!.add(res);
    res.on("close", () => {
      this.clients.get(projectId)?.delete(res);
    });
  }

  broadcast(projectId: number, event: string, data: unknown) {
    const clients = this.clients.get(projectId);
    if (!clients || clients.size === 0) return;
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      try {
        res.write(message);
      } catch {
        clients.delete(res);
      }
    }
  }

  clientCount(projectId: number) {
    return this.clients.get(projectId)?.size ?? 0;
  }
}

export const sseController = new SSEController();
