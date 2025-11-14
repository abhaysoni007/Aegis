import express, { Express, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { setupYjsWebSocketServer } from './y-websocket-server';
import { setupSocketIO } from './socket';
import { setupTerminalNamespace } from './terminal';
import documentsRouter from './routes/documents';
import chatRouter from './routes/chat';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/editor-replica';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API Routes
app.use('/api/documents', documentsRouter);
app.use('/api/documents', chatRouter);

// Create HTTP server
const httpServer = http.createServer(app);

// Setup Yjs WebSocket server
setupYjsWebSocketServer(httpServer, '/yjs');

// Setup Socket.IO for chat and presence
const io = setupSocketIO(httpServer);

// Setup Terminal namespace
setupTerminalNamespace(io);

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Yjs WebSocket server on ws://localhost:${PORT}/yjs`);
      console.log(`💬 Socket.IO chat namespace: /chat`);
      console.log(`🖥️  Socket.IO terminal namespace: /terminal`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
