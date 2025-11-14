import React from 'react';
import { X, File } from 'lucide-react';
import { Document } from '../lib/api';

interface TabBarProps {
  tabs: Document[];
  activeTabId?: string;
  onTabSelect: (docId: string) => void;
  onTabClose: (docId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
}) => {
  if (tabs.length === 0) {
    return (
      <div className="h-10 bg-vscode-panel border-b border-vscode-border flex items-center px-4">
        <span className="text-sm text-vscode-text-muted">No files open</span>
      </div>
    );
  }

  return (
    <div className="h-10 bg-vscode-panel border-b border-vscode-border flex items-center overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.docId}
          className={`tab ${activeTabId === tab.docId ? 'active' : ''} group`}
          onClick={() => onTabSelect(tab.docId)}
        >
          <File className="w-4 h-4 text-vscode-text-muted" />
          <span className="text-sm text-vscode-text truncate flex-1">
            {tab.name}
          </span>
          <button
            className="tab-close p-0.5 hover:bg-vscode-hover rounded"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.docId);
            }}
          >
            <X className="w-3.5 h-3.5 text-vscode-text-muted" />
          </button>
        </div>
      ))}
    </div>
  );
};
