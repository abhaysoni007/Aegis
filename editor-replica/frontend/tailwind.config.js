/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#1e1e1e',
        'vscode-sidebar': '#252526',
        'vscode-editor': '#1e1e1e',
        'vscode-panel': '#252526',
        'vscode-border': '#3e3e42',
        'vscode-text': '#cccccc',
        'vscode-text-muted': '#858585',
        'vscode-accent': '#007acc',
        'vscode-hover': '#2a2d2e',
      },
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
