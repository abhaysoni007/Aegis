import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const YJS_SERVER_URL = import.meta.env.VITE_YJS_URL || 'ws://localhost:4000';

export interface YjsConnection {
  doc: Y.Doc;
  provider: WebsocketProvider;
  text: Y.Text;
  disconnect: () => void;
}

/**
 * Create a Yjs document connection for collaborative editing
 * @param docId - Unique document identifier
 * @param onSync - Callback when document is synced
 * @param onStatusChange - Callback when connection status changes
 */
export function createYjsConnection(
  docId: string,
  onSync?: (synced: boolean) => void,
  onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
): YjsConnection {
  // Create a new Yjs document
  const doc = new Y.Doc();
  
  // Get or create the shared text type for the document content
  const text = doc.getText('content');
  
  // Create WebSocket provider for real-time sync
  const provider = new WebsocketProvider(
    YJS_SERVER_URL,
    `doc:${docId}`,
    doc,
    {
      connect: true,
      // Reconnect automatically
      maxBackoffTime: 5000,
    }
  );

  // Setup event listeners
  provider.on('status', (event: { status: string }) => {
    console.log('Yjs connection status:', event.status);
    if (onStatusChange) {
      onStatusChange(event.status as 'connected' | 'disconnected' | 'connecting');
    }
  });

  provider.on('sync', (synced: boolean) => {
    console.log('Yjs document synced:', synced);
    if (onSync) {
      onSync(synced);
    }
  });

  provider.on('connection-error', (error: Error) => {
    console.error('Yjs connection error:', error);
  });

  // Cleanup function
  const disconnect = () => {
    provider.disconnect();
    doc.destroy();
  };

  return {
    doc,
    provider,
    text,
    disconnect,
  };
}

/**
 * Get the current content from a Yjs text
 */
export function getYjsContent(text: Y.Text): string {
  return text.toString();
}

/**
 * Set the content of a Yjs text (replaces all content)
 */
export function setYjsContent(text: Y.Text, content: string): void {
  text.delete(0, text.length);
  text.insert(0, content);
}
