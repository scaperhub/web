import type WebSocket from 'ws';

type WsClientMap = Map<string, Set<WebSocket>>;

type GlobalState = typeof globalThis & {
  __wsClients?: WsClientMap;
};

function getClientMap(): WsClientMap {
  const g = globalThis as GlobalState;
  if (!g.__wsClients) {
    g.__wsClients = new Map();
  }
  return g.__wsClients;
}

export function addClient(userId: string, ws: WebSocket) {
  const map = getClientMap();
  const clients = map.get(userId) || new Set<WebSocket>();
  clients.add(ws);
  map.set(userId, clients);
}

export function removeClient(ws: WebSocket) {
  const map = getClientMap();
  map.forEach((set, userId) => {
    if (!set.has(ws)) return;
    set.delete(ws);
    if (set.size === 0) {
      map.delete(userId);
    } else {
      map.set(userId, set);
    }
  });
}

export function broadcastToUsers(userIds: string[], payload: unknown) {
  const map = getClientMap();
  const message = JSON.stringify(payload);

  userIds.forEach(id => {
    const clients = map.get(id);
    if (!clients) return;
    clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  });
}

export function broadcastToAll(payload: unknown) {
  const map = getClientMap();
  const message = JSON.stringify(payload);

  map.forEach(clients => {
    clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  });
}

