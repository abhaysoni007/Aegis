import { Server as SocketIOServer, Socket } from 'socket.io';
import * as pty from 'node-pty';
import * as os from 'os';

interface TerminalSession {
  ptyProcess: pty.IPty;
  userId: string;
}

// Store active terminal sessions
const terminalSessions = new Map<string, TerminalSession>();

export function setupTerminalNamespace(io: SocketIOServer) {
  const terminalNamespace = io.of('/terminal');

  terminalNamespace.on('connection', (socket: Socket) => {
    console.log('New terminal connection:', socket.id);

    // Create a new terminal session
    socket.on('terminal:create', ({ userId, cols = 80, rows = 24 }) => {
      console.log(`Creating terminal for user ${userId}`);

      try {
        // Determine shell based on platform
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        
        // Create PTY process
        const ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: cols || 80,
          rows: rows || 24,
          cwd: process.env.HOME || process.cwd(),
          env: process.env as { [key: string]: string },
        });

        const sessionId = socket.id;
        terminalSessions.set(sessionId, { ptyProcess, userId });

        // Send data from PTY to client
        ptyProcess.onData((data: string) => {
          socket.emit('terminal:data', { sessionId, data });
        });

        // Handle PTY exit
        ptyProcess.onExit(({ exitCode, signal }) => {
          console.log(`Terminal exited: code=${exitCode}, signal=${signal}`);
          socket.emit('terminal:exit', { sessionId, exitCode, signal });
          terminalSessions.delete(sessionId);
        });

        socket.emit('terminal:created', { sessionId });
        console.log(`Terminal session created: ${sessionId}`);
      } catch (error) {
        console.error('Error creating terminal:', error);
        socket.emit('terminal:error', { 
          message: 'Failed to create terminal session',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Handle input from client
    socket.on('terminal:input', ({ sessionId, data }) => {
      const session = terminalSessions.get(sessionId || socket.id);
      if (session) {
        try {
          session.ptyProcess.write(data);
        } catch (error) {
          console.error('Error writing to terminal:', error);
        }
      }
    });

    // Handle terminal resize
    socket.on('terminal:resize', ({ sessionId, cols, rows }) => {
      const session = terminalSessions.get(sessionId || socket.id);
      if (session) {
        try {
          session.ptyProcess.resize(cols, rows);
          console.log(`Terminal resized: ${cols}x${rows}`);
        } catch (error) {
          console.error('Error resizing terminal:', error);
        }
      }
    });

    // Handle terminal kill
    socket.on('terminal:kill', ({ sessionId }) => {
      const session = terminalSessions.get(sessionId || socket.id);
      if (session) {
        try {
          session.ptyProcess.kill();
          terminalSessions.delete(sessionId || socket.id);
          socket.emit('terminal:killed', { sessionId });
          console.log(`Terminal killed: ${sessionId}`);
        } catch (error) {
          console.error('Error killing terminal:', error);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Terminal connection disconnected:', socket.id);
      
      // Clean up terminal session
      const session = terminalSessions.get(socket.id);
      if (session) {
        try {
          session.ptyProcess.kill();
          terminalSessions.delete(socket.id);
          console.log(`Cleaned up terminal session: ${socket.id}`);
        } catch (error) {
          console.error('Error cleaning up terminal:', error);
        }
      }
    });
  });

  console.log('Terminal namespace setup complete');
  return terminalNamespace;
}
