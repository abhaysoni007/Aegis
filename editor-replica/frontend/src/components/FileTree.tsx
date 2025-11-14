import React, { useState, useEffect } from 'react';
import { File, Folder, FolderOpen, Plus, Trash2, Edit2 } from 'lucide-react';
import { documentAPI, Document } from '../lib/api';

interface FileTreeProps {
  onFileSelect: (doc: Document) => void;
  selectedDocId?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, selectedDocId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; docId?: string } | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await documentAPI.getAll();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFile = async () => {
    const name = prompt('Enter file name:');
    if (!name) return;

    try {
      const newDoc = await documentAPI.create({ name, path: [] });
      setDocuments([...documents, newDoc]);
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file');
    }
  };

  const handleDeleteFile = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await documentAPI.delete(docId);
      setDocuments(documents.filter(doc => doc.docId !== docId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  const handleRenameFile = async (doc: Document) => {
    const newName = prompt('Enter new name:', doc.name);
    if (!newName || newName === doc.name) return;

    try {
      const updated = await documentAPI.update(doc.docId, { name: newName });
      setDocuments(documents.map(d => d.docId === doc.docId ? updated : d));
    } catch (error) {
      console.error('Failed to rename file:', error);
      alert('Failed to rename file');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return <File className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex items-center justify-center text-vscode-text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-vscode-border">
        <span className="text-xs font-semibold text-vscode-text uppercase tracking-wide">
          Explorer
        </span>
        <button
          onClick={handleCreateFile}
          className="p-1 hover:bg-vscode-hover rounded transition-colors"
          title="New File"
        >
          <Plus className="w-4 h-4 text-vscode-text" />
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div className="text-center text-vscode-text-muted text-sm py-8">
            No files yet. Click + to create one.
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map(doc => (
              <div
                key={doc.docId}
                className={`file-tree-item ${selectedDocId === doc.docId ? 'active' : ''}`}
                onClick={() => onFileSelect(doc)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, docId: doc.docId });
                }}
              >
                {getFileIcon(doc.name)}
                <span className="flex-1 text-sm text-vscode-text truncate">
                  {doc.name}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameFile(doc);
                    }}
                    className="p-1 hover:bg-vscode-hover rounded"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3 text-vscode-text-muted" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(doc.docId);
                    }}
                    className="p-1 hover:bg-vscode-hover rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-vscode-text-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-vscode-panel border border-vscode-border rounded shadow-lg py-1 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm text-vscode-text hover:bg-vscode-hover"
              onClick={() => {
                const doc = documents.find(d => d.docId === contextMenu.docId);
                if (doc) handleRenameFile(doc);
                setContextMenu(null);
              }}
            >
              Rename
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm text-vscode-text hover:bg-vscode-hover"
              onClick={() => {
                if (contextMenu.docId) handleDeleteFile(contextMenu.docId);
                setContextMenu(null);
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};
