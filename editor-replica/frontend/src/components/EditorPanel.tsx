import React, { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { createYjsConnection, YjsConnection } from '../lib/yjsClient';
import { User } from '../lib/socketClient';

interface EditorPanelProps {
  docId: string;
  initialContent?: string;
  language?: string;
  onContentChange?: (content: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  remoteUsers?: User[];
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  docId,
  initialContent = '',
  language = 'javascript',
  onContentChange,
  onCursorChange,
  remoteUsers = [],
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const yjsConnectionRef = useRef<YjsConnection | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [isReady, setIsReady] = useState(false);
  const decorationsRef = useRef<string[]>([]);

  // Initialize editor and Yjs connection
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Setup Yjs connection
    const yjsConnection = createYjsConnection(
      docId,
      (synced) => {
        console.log('Document synced:', synced);
        setIsReady(synced);
      },
      (status) => {
        console.log('Yjs status:', status);
      }
    );

    yjsConnectionRef.current = yjsConnection;

    // Create Monaco binding for collaborative editing
    const binding = new MonacoBinding(
      yjsConnection.text,
      editor.getModel()!,
      new Set([editor]),
      yjsConnection.provider.awareness
    );

    bindingRef.current = binding;

    // Set initial content if provided and document is empty
    if (initialContent && yjsConnection.text.length === 0) {
      yjsConnection.text.insert(0, initialContent);
    }

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      if (onCursorChange) {
        onCursorChange(position.lineNumber, position.column);
      }
    });

    // Track content changes
    editor.onDidChangeModelContent(() => {
      if (onContentChange) {
        onContentChange(editor.getValue());
      }
    });

    // Focus editor
    editor.focus();
  };

  // Update remote user cursors
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;

    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    // Create decorations for remote users
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    remoteUsers.forEach(user => {
      if (user.cursor) {
        // Cursor decoration
        newDecorations.push({
          range: new monacoInstance.Range(
            user.cursor.line,
            user.cursor.col,
            user.cursor.line,
            user.cursor.col
          ),
          options: {
            className: 'remote-cursor',
            beforeContentClassName: 'remote-cursor-label',
            before: {
              content: user.username,
              inlineClassName: 'remote-cursor-label-text',
              inlineClassNameAffectsLetterSpacing: true,
            },
            stickiness: monacoInstance.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }

      if (user.selection) {
        // Selection decoration
        newDecorations.push({
          range: new monacoInstance.Range(
            user.selection.start.line,
            user.selection.start.col,
            user.selection.end.line,
            user.selection.end.col
          ),
          options: {
            className: 'remote-selection',
            inlineClassName: `remote-selection-inline`,
            stickiness: monacoInstance.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations([], newDecorations);

    // Add custom CSS for remote cursors
    const style = document.getElementById('remote-cursor-styles') || document.createElement('style');
    style.id = 'remote-cursor-styles';
    style.innerHTML = `
      .remote-cursor {
        border-left: 2px solid var(--user-color, #007acc);
        position: relative;
      }
      .remote-cursor-label {
        position: absolute;
        top: -20px;
        left: -2px;
        background: var(--user-color, #007acc);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 1000;
      }
      .remote-selection {
        background: rgba(0, 122, 204, 0.2);
      }
    `;
    if (!document.getElementById('remote-cursor-styles')) {
      document.head.appendChild(style);
    }
  }, [remoteUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      yjsConnectionRef.current?.disconnect();
    };
  }, [docId]);

  return (
    <div className="flex-1 relative">
      <Editor
        height="100%"
        defaultLanguage={language}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: 'Consolas, Monaco, Courier New, monospace',
          lineNumbers: 'on',
          rulers: [],
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'off',
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
        onMount={handleEditorDidMount}
      />
      {!isReady && (
        <div className="absolute inset-0 bg-vscode-editor bg-opacity-90 flex items-center justify-center">
          <div className="text-vscode-text">Connecting to collaboration server...</div>
        </div>
      )}
    </div>
  );
};
