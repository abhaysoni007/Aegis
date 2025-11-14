import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import ChatMessage from './models/ChatMessage';

interface UserPresence {
  userId: string;
  username: string;
  color: string;
  cursor?: { line: number; col: number };
  selection?: { start: { line: number; col: number }; end: { line: number; col: number } };
}

// Store active users per document room
const roomUsers = new Map<string, Map<string, UserPresence>>();

// Generate a random color for user cursor
function generateUserColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Chat namespace
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket: Socket) => {
    console.log('New chat connection:', socket.id);

    // Join a document room
    socket.on('join_room', async ({ docId, userId, username }) => {
      console.log(`User ${username} (${userId}) joining room: ${docId}`);
      
      socket.join(docId);
      
      // Add user to room presence
      if (!roomUsers.has(docId)) {
        roomUsers.set(docId, new Map());
      }
      
      const userColor = generateUserColor();
      const userPresence: UserPresence = {
        userId,
        username,
        color: userColor,
      };
      
      roomUsers.get(docId)!.set(userId, userPresence);
      
      // Broadcast user joined to others in the room
      socket.to(docId).emit('user_joined', {
        docId,
        userId,
        username,
        color: userColor,
      });
      
      // Send current users list to the new user
      const currentUsers = Array.from(roomUsers.get(docId)!.values());
      socket.emit('room_users', { docId, users: currentUsers });
      
      // Send chat history
      try {
        const messages = await ChatMessage.find({ docId })
          .sort({ createdAt: -1 })
          .limit(100);
        socket.emit('chat_history', messages.reverse());
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    });

    // Leave a document room
    socket.on('leave_room', ({ docId, userId }) => {
      console.log(`User ${userId} leaving room: ${docId}`);
      
      socket.leave(docId);
      
      // Remove user from room presence
      if (roomUsers.has(docId)) {
        roomUsers.get(docId)!.delete(userId);
        
        // Clean up empty rooms
        if (roomUsers.get(docId)!.size === 0) {
          roomUsers.delete(docId);
        }
      }
      
      // Broadcast user left
      socket.to(docId).emit('user_left', { docId, userId });
    });

    // Handle presence updates (cursor position, selection)
    socket.on('presence_update', ({ docId, userId, cursor, selection }) => {
      if (roomUsers.has(docId) && roomUsers.get(docId)!.has(userId)) {
        const userPresence = roomUsers.get(docId)!.get(userId)!;
        userPresence.cursor = cursor;
        userPresence.selection = selection;
        
        // Broadcast to others in the room
        socket.to(docId).emit('presence_update', {
          docId,
          userId,
          cursor,
          selection,
          color: userPresence.color,
          username: userPresence.username,
        });
      }
    });

    // Handle chat messages
    socket.on('chat_message', async ({ docId, userId, username, content }) => {
      console.log(`Chat message in ${docId} from ${username}: ${content}`);
      
      try {
        // Save message to database
        const message = new ChatMessage({
          docId,
          userId,
          username,
          content,
        });
        
        await message.save();
        
        // Broadcast to all users in the room (including sender)
        chatNamespace.to(docId).emit('new_message', {
          id: message._id,
          docId: message.docId,
          userId: message.userId,
          username: message.username,
          content: message.content,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('Error saving chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Chat connection disconnected:', socket.id);
      
      // Clean up user from all rooms
      roomUsers.forEach((users, docId) => {
        users.forEach((user, userId) => {
          // Note: In production, you'd want to track socket.id to userId mapping
          // For now, we rely on explicit leave_room calls
        });
      });
    });
  });

  console.log('Socket.IO chat namespace setup complete');
  return io;
}
