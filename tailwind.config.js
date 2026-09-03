/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff3ec',
          100: '#ffe3d1',
          200: '#ffc4a3',
          300: '#ff9d6b',
          400: '#fd7c40',
          500: '#f4611f',
          600: '#e04e14',
          700: '#b93c10',
          800: '#933213',
          900: '#772c13',
          950: '#401307',
        },
        gold: {
          50: '#fbf7ec',
          100: '#f5ecd0',
          200: '#ecd8a3',
          300: '#e0bf6f',
          400: '#d4a745',
          500: '#c69a3a',
          600: '#a67c2b',
          700: '#835e24',
          800: '#6c4c23',
          900: '#5c4020',
          950: '#332110',
        },
        ink: {
          50: '#f7f7f8',
          100: '#eeeeef',
          200: '#dcdcdf',
          300: '#b8b8bd',
          400: '#8c8c93',
          500: '#67676f',
          600: '#4d4d54',
          700: '#3a3a40',
          800: '#292a2e',
          900: '#1a1b1e',
          950: '#0d0d0f',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        card: '0 1px 3px 0 rgb(16 24 40 / 0.06), 0 1px 2px -1px rgb(16 24 40 / 0.05)',
        pop: '0 4px 16px -2px rgb(16 24 40 / 0.08), 0 2px 6px -2px rgb(16 24 40 / 0.05)',
        float: '0 12px 32px -8px rgb(16 24 40 / 0.14)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
