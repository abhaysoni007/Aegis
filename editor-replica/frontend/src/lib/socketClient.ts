import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export interface User {
  userId: string;
  username: string;
  color: string;
  cursor?: { line: number; col: number };
  selection?: { start: { line: number; col: number }; end: { line: number; col: number } };
}

export interface ChatMessage {
  id: string;
  docId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface SocketCallbacks {
  onUserJoined?: (user: User) => void;
  onUserLeft?: (data: { docId: string; userId: string }) => void;
  onRoomUsers?: (data: { docId: string; users: User[] }) => void;
  onPresenceUpdate?: (data: User) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onChatHistory?: (messages: ChatMessage[]) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private callbacks: SocketCallbacks = {};

  connect(callbacks: SocketCallbacks = {}): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.callbacks = callbacks;

    // Connect to chat namespace
    this.socket = io(`${SOCKET_SERVER_URL}/chat`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket.IO error:', error);
      this.callbacks.onError?.(error);
    });

    this.socket.on('user_joined', (data: User) => {
      console.log('User joined:', data);
      this.callbacks.onUserJoined?.(data);
    });

    this.socket.on('user_left', (data: { docId: string; userId: string }) => {
      console.log('User left:', data);
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on('room_users', (data: { docId: string; users: User[] }) => {
      console.log('Room users:', data);
      this.callbacks.onRoomUsers?.(data);
    });

    this.socket.on('presence_update', (data: User) => {
      this.callbacks.onPresenceUpdate?.(data);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('New message:', message);
      this.callbacks.onNewMessage?.(message);
    });

    this.socket.on('chat_history', (messages: ChatMessage[]) => {
      console.log('Chat history received:', messages.length);
      this.callbacks.onChatHistory?.(messages);
    });
  }

  joinRoom(docId: string, userId: string, username: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('join_room', { docId, userId, username });
  }

  leaveRoom(docId: string, userId: string) {
    if (!this.socket) return;
    this.socket.emit('leave_room', { docId, userId });
  }

  updatePresence(
    docId: string,
    userId: string,
    cursor?: { line: number; col: number },
    selection?: { start: { line: number; col: number }; end: { line: number; col: number } }
  ) {
    if (!this.socket) return;
    this.socket.emit('presence_update', { docId, userId, cursor, selection });
  }

  sendMessage(docId: string, userId: string, username: string, content: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('chat_message', { docId, userId, username, content });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
