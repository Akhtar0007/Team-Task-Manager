const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const enrichConversation = async (conv) => {
  const u1 = await prisma.user.findUnique({ where: { id: conv.participant1Id }, select: { id: true, name: true, email: true, role: true } });
  const u2 = await prisma.user.findUnique({ where: { id: conv.participant2Id }, select: { id: true, name: true, email: true, role: true } });
  return { ...conv, participant1: u1, participant2: u2 };
};

const startOrGetConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ error: 'participantId required' });

    const other = await prisma.user.findUnique({ where: { id: participantId } });
    if (!other) return res.status(404).json({ error: 'User not found' });
    if (other.id === req.user.id) return res.status(400).json({ error: 'Cannot DM yourself' });

    const p1 = req.user.id < other.id ? req.user.id : other.id;
    const p2 = req.user.id < other.id ? other.id : req.user.id;

    const existing = await prisma.conversation.findFirst({
      where: { participant1Id: p1, participant2Id: p2 }
    });

    if (existing) return res.json(await enrichConversation(existing));

    const conversation = await prisma.conversation.create({
      data: { participant1Id: p1, participant2Id: p2 }
    });

    res.status(201).json(await enrichConversation(conversation));
  } catch (error) {
    next(error);
  }
};

const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    const enriched = await Promise.all(conversations.map(enrichConversation));
    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

const enrichMessage = async (msg) => {
  const u = await prisma.user.findUnique({ where: { id: msg.userId }, select: { id: true, name: true, email: true, role: true } });
  return { ...msg, user: u };
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const since = req.query.since ? new Date(req.query.since) : new Date(0);

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        createdAt: { gt: since }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    const enriched = await Promise.all(messages.map(enrichMessage));
    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, conversationId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        conversationId,
        userId: req.user.id
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(await enrichMessage(message));
  } catch (error) {
    next(error);
  }
};

module.exports = { startOrGetConversation, getMyConversations, getMessages, sendMessage };
