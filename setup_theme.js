const fs = require('fs');

const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
        'panel-hover': 'var(--bg-panel-hover)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        highlight: 'var(--text-highlight)',
        themeBorder: 'var(--border-color)',
        focus: 'var(--border-focus)',
        accent: 'var(--accent-primary)',
        'accent-hover': 'var(--accent-hover)',
        error: 'var(--error)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
      }
    },
  },
  plugins: [],
};
export default config;`;

fs.writeFileSync('frontend/tailwind.config.ts', tailwindConfig);

const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-base: #000000;
  --bg-panel: #0a0a0a;
  --bg-panel-hover: #141414;
  --text-main: #ededed;
  --text-muted: #888888;
  --text-highlight: #ffffff;
  --border-color: #222222;
  --border-focus: #666666;
  --accent-primary: #ffffff;
  --accent-hover: #e0e0e0;
  --error: #ff453a;
  --bg-glow: rgba(255, 255, 255, 0.03);
  --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
}

body.light-theme {
  --bg-base: #FCF9F2;
  --bg-panel: #FDFBF7;
  --bg-panel-hover: #F5EFE6;
  --text-main: #3E2F24;
  --text-muted: #8E7A6B;
  --text-highlight: #2A1D13;
  --border-color: #EBDCCB;
  --border-focus: #D2A679;
  --accent-primary: #D2A679;
  --accent-hover: #C29668;
  --error: #ff3b30;
  --bg-glow: rgba(210, 166, 121, 0.1);
}

body {
  background-color: var(--bg-base);
  color: var(--text-main);
  font-family: var(--font-body);
  background-image: radial-gradient(circle at 50% 0%, var(--bg-glow) 0%, transparent 50%);
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Glass Panel Standard */
.glass-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
}
.glass-panel:hover {
  background: var(--bg-panel-hover);
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-highlight);
}

/* Typography overrides */
.text-muted { color: var(--text-muted); }
.text-highlight { color: var(--text-highlight); }
.text-accent { color: var(--accent-primary); }
.text-error { color: var(--error); }

/* Inputs & Buttons */
input, select, textarea {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: border-color 0.2s ease;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--border-focus);
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-base);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: background 0.2s, transform 0.1s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-highlight);
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-panel-hover);
  border-color: var(--border-focus);
}
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }

@keyframes floatAndPulse {
  0%, 100% { transform: translateY(0); opacity: 0.8; }
  50% { transform: translateY(-5px); opacity: 1; }
}
.animate-float-pulse { animation: floatAndPulse 3s ease-in-out infinite; }

@keyframes pulseText {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse-text { animation: pulseText 2s ease-in-out infinite; }
`;

fs.writeFileSync('frontend/src/app/globals.css', globalsCss);
console.log('Restored token theme system files.');
