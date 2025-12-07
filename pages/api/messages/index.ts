import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Message, Conversation } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { conversationId } = req.query;
    
    if (conversationId) {
      const messages = await db.messages.getByConversation(conversationId as string);
      return res.status(200).json({ messages });
    }

    // Get all conversations for user
    const conversations = await db.conversations.getByUser(user.id);
    return res.status(200).json({ conversations });
  }

  if (req.method === 'POST') {
    const { itemId, receiverId, content, conversationId } = req.body;

    if (!itemId || !receiverId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const item = await db.items.getById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Find or create conversation
    let conversation: Conversation | undefined;
    if (conversationId) {
      conversation = await db.conversations.getById(conversationId);
    } else {
      conversation = await db.conversations.getByItemAndBuyer(itemId, user.id);
    }

    if (!conversation) {
      conversation = {
        id: generateId(),
        itemId,
        buyerId: user.id,
        sellerId: item.sellerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.conversations.create(conversation);
    }

    // Create message
    const message: Message = {
      id: generateId(),
      conversationId: conversation.id,
      senderId: user.id,
      receiverId,
      itemId,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };

    await db.messages.create(message);

    // Update conversation
    await db.conversations.update(conversation.id, {
      updatedAt: new Date().toISOString(),
      lastMessage: content,
      lastMessageAt: new Date().toISOString(),
    });

    return res.status(201).json({ message, conversation });
  }

  if (req.method === 'PUT') {
    const { conversationId, markAsRead } = req.body;
    
    if (markAsRead && conversationId) {
      await db.messages.markAsRead(conversationId, user.id);
      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
