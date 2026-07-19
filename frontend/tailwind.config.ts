import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
        'panel-hover': 'var(--bg-panel-hover)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        highlight: 'var(--text-highlight)',
        accent: 'var(--accent)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-hover': 'var(--accent-hover)',
        themeBorder: 'var(--border)',
        focus: 'var(--border-focus)',
        error: 'var(--error)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        
        // shadcn compatibility mapping
        background: 'var(--bg-base)',
        foreground: 'var(--text-primary)',
        'muted-foreground': 'var(--text-muted)',
        'primary-foreground': 'var(--bg-base)',
        'secondary': 'var(--bg-panel)',
        'secondary-foreground': 'var(--text-primary)',
        'accent-foreground': 'var(--text-primary)',
        'border': 'var(--border)',
        'input': 'var(--border)',
        'ring': 'var(--border-focus)',

        // Growly LMS brand tokens
        'growly-bg': '#FAFBFB',
        'growly-card': '#FFFFFF',
        'growly-ink': '#06070B',
        'growly-muted': '#7593A1',
        'growly-blue': '#003799',
        'growly-steel': '#3D73B6',
        'growly-sage': '#B7C5BC',
        'growly-sage-light': '#E8F0EB',
        'growly-blue-light': '#EEF3FF',
        'growly-blue-mid': '#D6E0FF',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        'glass': '0 4px 24px -1px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(110, 86, 207, 0.15)',
        'glow-hover': '0 0 30px rgba(110, 86, 207, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    }
  }
} satisfies Config;