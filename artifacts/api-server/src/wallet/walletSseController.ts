import type { Response } from "express";

type SseClient = Response;

class WalletSseController {
  private clients = new Map<string, Set<SseClient>>();

  subscribe(userId: string, res: SseClient) {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(res);
    res.on("close", () => this.unsubscribe(userId, res));
  }

  private unsubscribe(userId: string, res: SseClient) {
    const set = this.clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) this.clients.delete(userId);
  }

  emit(userId: string, event: string, data: unknown) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) {
      try {
        res.write(payload);
      } catch {
        set.delete(res);
      }
    }
  }
}

export const walletSseController = new WalletSseController();
