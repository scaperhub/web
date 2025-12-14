import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { broadcastToUsers } from '@/lib/realtime';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing item id' });
  }

  const item = await db.items.getById(id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (item.sellerId === user.id) {
    return res.status(400).json({ error: 'Sellers cannot mark interest on their own item' });
  }

  // Find or create conversation for this item + buyer
  let conversation = await db.conversations.getByItemAndBuyer(id, user.id);
  const now = new Date().toISOString();

  if (!conversation) {
    conversation = {
      id: generateId(),
      itemId: id,
      buyerId: user.id,
      sellerId: item.sellerId,
      createdAt: now,
      updatedAt: now,
      lastMessage: 'Interested in this item',
      lastMessageAt: now,
    };
    await db.conversations.create(conversation);
  } else {
    await db.conversations.update(conversation.id, {
      updatedAt: now,
      lastMessage: 'Interested in this item',
      lastMessageAt: now,
    });
  }

  // Create a system message representing the interest
  const interestMessage = {
    id: generateId(),
    conversationId: conversation.id,
    senderId: user.id,
    receiverId: item.sellerId,
    itemId: id,
    content: "I'm interested in this listing.",
    createdAt: now,
    read: false,
  };
  await db.messages.create(interestMessage);

  // Notify seller about new interest + new message
  broadcastToUsers([item.sellerId], {
    type: 'message:new',
    conversationId: conversation.id,
    itemId: id,
    message: interestMessage,
  });

  return res.status(200).json({ conversationId: conversation.id });
}

