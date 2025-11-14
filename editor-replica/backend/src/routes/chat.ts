import express, { Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage';

const router = express.Router();

// GET /api/documents/:docId/chat - Get chat history for a document
router.get('/:docId/chat', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const messages = await ChatMessage.find({ docId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // Reverse to get chronological order
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST /api/documents/:docId/chat - Create a chat message (used by Socket.IO handler)
router.post('/:docId/chat', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const { userId, username, content } = req.body;
    
    if (!userId || !username || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const message = new ChatMessage({
      docId,
      userId,
      username,
      content,
    });
    
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ error: 'Failed to create chat message' });
  }
});

export default router;
