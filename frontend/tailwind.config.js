/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand / Primary
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "notification": "var(--color-notification)",
        // Backgrounds
        "background-light": "var(--color-bg-light)",
        "background-dark": "var(--color-bg-dark)",

        // Surfaces
        "surface-dark": "var(--color-surface-dark)",
        "surface-border": "var(--color-surface-border)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-focus": "var(--color-surface-focus)",
        "surface-hover": "var(--color-surface-hover)",
        "surface-muted": "var(--color-surface-muted)",

        // Panels (chat, modals)
        "panel-dark": "var(--color-panel-dark)",
        "panel-header": "var(--color-panel-header)",

        // Text
        "text-heading": "var(--color-text-heading)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-muted-light": "var(--color-text-muted-light)",

        // Scrollbar
        "scrollbar-thumb": "var(--color-scrollbar-thumb)",
        "scrollbar-hover": "var(--color-scrollbar-hover)",

        // Edge/graph
        "edge-default": "var(--color-edge-default)",
        "edge-dimmed": "var(--color-edge-dimmed)",

        // Node status colors
        "node-active": "var(--color-node-active)",
        "node-frozen": "var(--color-node-frozen)",
        "node-deleted": "var(--color-node-deleted)",
        "node-ai": "var(--color-node-ai)",
        "node-user": "var(--color-node-user)",

        // Semantic feedback
        "toast-success": "var(--color-toast-success)",
        "toast-error": "var(--color-toast-error)",
        "toast-info": "var(--color-toast-info)",

        // Merge accent
        "merge-accent": "var(--color-merge-accent)",
        "merge-accent-hover": "var(--color-merge-accent-hover)",
      },
      fontFamily: {
        display: ["Space Grotesk", "Noto Sans", "sans-serif"],
        body: ["Inter", "Noto Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(var(--color-surface-border) 1.5px, transparent 1.5px)",
      }
    },
  },
  plugins: [],
}
