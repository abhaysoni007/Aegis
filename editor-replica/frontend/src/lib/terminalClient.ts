import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export interface TerminalCallbacks {
  onData?: (data: { sessionId: string; data: string }) => void;
  onCreated?: (data: { sessionId: string }) => void;
  onExit?: (data: { sessionId: string; exitCode: number; signal?: number }) => void;
  onKilled?: (data: { sessionId: string }) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

class TerminalClient {
  private socket: Socket | null = null;
  private callbacks: TerminalCallbacks = {};

  connect(callbacks: TerminalCallbacks = {}): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.callbacks = callbacks;

    // Connect to terminal namespace
    this.socket = io(`${SOCKET_SERVER_URL}/terminal`, {
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
      console.log('Terminal socket connected:', this.socket?.id);
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Terminal socket disconnected');
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('terminal:data', (data: { sessionId: string; data: string }) => {
      this.callbacks.onData?.(data);
    });

    this.socket.on('terminal:created', (data: { sessionId: string }) => {
      console.log('Terminal created:', data.sessionId);
      this.callbacks.onCreated?.(data);
    });

    this.socket.on('terminal:exit', (data: { sessionId: string; exitCode: number; signal?: number }) => {
      console.log('Terminal exited:', data);
      this.callbacks.onExit?.(data);
    });

    this.socket.on('terminal:killed', (data: { sessionId: string }) => {
      console.log('Terminal killed:', data.sessionId);
      this.callbacks.onKilled?.(data);
    });

    this.socket.on('terminal:error', (error: any) => {
      console.error('Terminal error:', error);
      this.callbacks.onError?.(error);
    });
  }

  createTerminal(userId: string, cols: number = 80, rows: number = 24) {
    if (!this.socket) {
      throw new Error('Terminal socket not connected');
    }
    this.socket.emit('terminal:create', { userId, cols, rows });
  }

  sendInput(sessionId: string, data: string) {
    if (!this.socket) {
      throw new Error('Terminal socket not connected');
    }
    this.socket.emit('terminal:input', { sessionId, data });
  }

  resize(sessionId: string, cols: number, rows: number) {
    if (!this.socket) {
      throw new Error('Terminal socket not connected');
    }
    this.socket.emit('terminal:resize', { sessionId, cols, rows });
  }

  kill(sessionId: string) {
    if (!this.socket) {
      throw new Error('Terminal socket not connected');
    }
    this.socket.emit('terminal:kill', { sessionId });
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
export const terminalClient = new TerminalClient();
