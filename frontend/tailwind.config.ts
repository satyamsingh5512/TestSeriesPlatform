import type { Config } from "tailwindcss";

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
export default config;