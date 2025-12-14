import type { NextApiRequest, NextApiResponse } from 'next';
const { Server: WebSocketServer } = require('ws');
import { verifyToken } from '@/lib/auth';
import { addClient, removeClient, broadcastToUsers, broadcastToAll } from '@/lib/realtime';
import { db } from '@/lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Reuse the same WebSocket server instance across hot reloads
  const server = (res.socket as any)?.server as any;
  if (!server) {
    res.status(500).end();
    return;
  }

  if (!server.wss) {
    const wss = new WebSocketServer({ noServer: true });
    server.wss = wss;

    // Handle upgrades for the /api/ws path
    server.on('upgrade', (request: any, socket: any, head: any) => {
      const { pathname } = new URL(request.url || '', 'http://localhost');
      if (pathname === '/api/ws') {
        wss.handleUpgrade(request, socket, head, (ws: any) => {
          wss.emit('connection', ws, request);
        });
      }
    });

    wss.on('connection', (ws: any, request: any) => {
      let userId: string | null = null;

      try {
        const url = new URL(request.url || '', 'http://localhost');
        const token = url.searchParams.get('token');
        const decoded = token ? verifyToken(token) : null;

        if (!decoded) {
          ws.close();
          return;
        }

        userId = decoded.id;
        addClient(decoded.id, ws);
        ws.send(JSON.stringify({ type: 'connected' }));

        // Update presence on connect
        db.users.update(decoded.id, { lastSeen: new Date().toISOString() }).catch(() => {});
        broadcastToAll({ type: 'presence', userId: decoded.id, lastSeen: new Date().toISOString() });

        ws.on('message', async (msg: any) => {
          try {
            const payload = JSON.parse(msg.toString());

            // Typing indicator
            if (payload.type === 'typing' && payload.conversationId) {
              const conversation = await db.conversations.getById(payload.conversationId);
              if (!conversation) return;
              const targetUserId =
                conversation.buyerId === decoded.id ? conversation.sellerId : conversation.buyerId;
              broadcastToUsers([targetUserId], {
                type: 'typing',
                conversationId: payload.conversationId,
                userId: decoded.id,
                isTyping: !!payload.isTyping,
              });
              return;
            }

            // Presence ping
            if (payload.type === 'presence:ping') {
              const now = new Date().toISOString();
              db.users.update(decoded.id, { lastSeen: now }).catch(() => {});
              broadcastToAll({ type: 'presence', userId: decoded.id, lastSeen: now });
              return;
            }
          } catch {
            // ignore malformed messages
          }
        });

        ws.on('close', () => {
          if (userId) {
            const now = new Date().toISOString();
            db.users.update(userId, { lastSeen: now }).catch(() => {});
            broadcastToAll({ type: 'presence', userId, lastSeen: now });
          }
          removeClient(ws);
        });
        ws.on('error', () => {
          if (userId) {
            const now = new Date().toISOString();
            db.users.update(userId, { lastSeen: now }).catch(() => {});
            broadcastToAll({ type: 'presence', userId, lastSeen: now });
          }
          removeClient(ws);
        });
      } catch (err) {
        ws.close();
      }
    });
  }

  res.end();
}

