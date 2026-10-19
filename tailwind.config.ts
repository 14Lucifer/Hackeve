import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#22C55E',
          hover: '#16A34A',
          soft: '#DCFCE7',
          700: '#15803D',
        },
        bg: {
          DEFAULT: '#FFFFFF',
          subtle: '#F9FAFB',
          dark: '#0F0F10',
          'dark-surface': '#17171A',
        },
        line: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
          dark: '#27272A',
        },
        ink: {
          DEFAULT: '#111827',
          muted: '#6B7280',
          subtle: '#9CA3AF',
          invert: '#F4F4F5',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'soft-md': '0 2px 4px 0 rgb(0 0 0 / 0.05), 0 4px 8px -2px rgb(0 0 0 / 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
