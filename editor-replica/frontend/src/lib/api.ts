import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Document {
  _id: string;
  docId: string;
  name: string;
  path: string[];
  content?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  _id?: string;
  id?: string;
  docId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

// Document APIs
export const documentAPI = {
  getAll: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },

  getById: async (docId: string): Promise<Document> => {
    const response = await api.get(`/documents/${docId}`);
    return response.data;
  },

  create: async (data: { name: string; parentId?: string; path?: string[] }): Promise<Document> => {
    const response = await api.post('/documents', data);
    return response.data;
  },

  update: async (docId: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/documents/${docId}`, data);
    return response.data;
  },

  delete: async (docId: string): Promise<void> => {
    await api.delete(`/documents/${docId}`);
  },
};

// Chat APIs
export const chatAPI = {
  getHistory: async (docId: string, limit: number = 100): Promise<ChatMessage[]> => {
    const response = await api.get(`/documents/${docId}/chat`, {
      params: { limit },
    });
    return response.data;
  },
};

export default api;
