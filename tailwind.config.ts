import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1a2332',
        ocean: '#2563EB',
        'ocean-light': '#DBEAFE',
        'score-excellent': '#059669',
        'score-good': '#10B981',
        'score-moderate': '#F59E0B',
        'score-poor': '#EF4444',
        'surface-0': '#FFFFFF',
        'surface-1': '#F8FAFC',
        'surface-2': '#F1F5F9',
        border: '#E2E8F0',
        'border-hover': '#CBD5E1',
        unavailable: '#94A3B8',
        'error-bg': '#FEF2F2',
        'error-text': '#DC2626',
        gold: '#B45309',
        'highlight-bg': '#FFFBEB',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-dot': 'pulse 1.5s ease-in-out infinite',
        'count-up': 'countUp 0.8s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
