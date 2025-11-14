import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Users } from 'lucide-react';
import { ChatMessage, User } from '../lib/socketClient';

interface ChatPanelProps {
  docId: string;
  currentUser: { userId: string; username: string };
  messages: ChatMessage[];
  users: User[];
  onSendMessage: (content: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  docId,
  currentUser,
  messages,
  users,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.color || '#007acc';
  };

  return (
    <div className="w-80 bg-vscode-sidebar border-l border-vscode-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-vscode-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-vscode-text" />
          <span className="text-xs font-semibold text-vscode-text uppercase tracking-wide">
            Team Chat
          </span>
        </div>
        <button
          onClick={() => setShowUsers(!showUsers)}
          className="flex items-center gap-1 px-2 py-1 hover:bg-vscode-hover rounded transition-colors"
          title="Show participants"
        >
          <Users className="w-4 h-4 text-vscode-text" />
          <span className="text-xs text-vscode-text">{users.length}</span>
        </button>
      </div>

      {/* Users List (collapsible) */}
      {showUsers && (
        <div className="border-b border-vscode-border p-3 bg-vscode-panel">
          <div className="text-xs font-semibold text-vscode-text mb-2">
            Active Users ({users.length})
          </div>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.userId} className="flex items-center gap-2">
                <div
                  className="presence-avatar"
                  style={{ backgroundColor: user.color }}
                >
                  {getInitials(user.username)}
                </div>
                <span className="text-sm text-vscode-text">{user.username}</span>
                {user.userId === currentUser.userId && (
                  <span className="text-xs text-vscode-text-muted">(you)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-vscode-text-muted text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.userId === currentUser.userId;
            const userColor = getUserColor(message.userId);

            return (
              <div key={message.id || index} className="chat-message">
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: userColor }}
                  >
                    {getInitials(message.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-vscode-text">
                        {message.username}
                        {isCurrentUser && (
                          <span className="text-xs text-vscode-text-muted ml-1">(you)</span>
                        )}
                      </span>
                      <span className="text-xs text-vscode-text-muted">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-vscode-text whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-vscode-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:border-vscode-accent"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-3 py-2 bg-vscode-accent text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
