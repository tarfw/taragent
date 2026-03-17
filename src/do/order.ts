import { DurableObject } from 'cloudflare:workers';

export class OrderDO extends DurableObject {
  // A Set to keep track of connected WebSocket clients
  private sessions = new Set<WebSocket>();

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      // Not a websocket request
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    this.ctx.acceptWebSocket(server);
    this.sessions.add(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Handle incoming WebSocket messages (e.g. from driver app)
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    console.log(`OrderDO received message: ${message}`);
    // Broadcast the message (e.g., driver location update) to all other connected clients (e.g., customer tracking)
    for (const session of this.sessions) {
      if (session !== ws) {
        try {
          session.send(message);
        } catch (e) {
          console.error("Failed to send message to session:", e);
        }
      }
    }
  }

  // Handle WebSocket close events
  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    this.sessions.delete(ws);
  }

  webSocketError(ws: WebSocket, error: unknown) {
    this.sessions.delete(ws);
  }
}
