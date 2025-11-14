import * as Y from 'yjs';
import { WebSocketServer } from 'ws';
import * as http from 'http';

// Yjs document storage (in-memory for now, can be persisted to DB)
const docs = new Map<string, Y.Doc>();

// Get or create a Yjs document
export function getYDoc(docName: string): Y.Doc {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);
    console.log(`Created new Yjs document: ${docName}`);
  }
  return doc;
}

// Setup Yjs WebSocket server
export function setupYjsWebSocketServer(server: http.Server, path: string = '/yjs') {
  const wss = new WebSocketServer({ 
    server,
    path,
  });

  console.log(`Yjs WebSocket server listening on path: ${path}`);

  wss.on('connection', (ws, req) => {
    console.log('New Yjs WebSocket connection');

    // Extract room name from URL query parameter
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const roomName = url.searchParams.get('room') || 'default';
    
    const doc = getYDoc(roomName);
    
    // Setup message handler
    ws.on('message', (message: Buffer) => {
      // Broadcast to all other clients in the same room
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(message);
        }
      });
      
      // Apply update to the Yjs document
      try {
        Y.applyUpdate(doc, new Uint8Array(message));
      } catch (error) {
        console.error('Error applying Yjs update:', error);
      }
    });

    // Send current document state to new client
    const state = Y.encodeStateAsUpdate(doc);
    ws.send(state);

    ws.on('close', () => {
      console.log('Yjs WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('Yjs WebSocket error:', error);
    });
  });

  return wss;
}
