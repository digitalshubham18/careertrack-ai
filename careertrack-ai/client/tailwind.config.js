/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12131A',
        'ink-soft': '#1B1D29',
        'ink-line': '#2B2E3D',
        paper: '#F7F7F5',
        'paper-soft': '#FFFFFF',
        'paper-line': '#E5E3DC',
        primary: {
          DEFAULT: '#4F3CC9',
          light: '#7C6AE0',
          dark: '#372A94',
        },
        accent: {
          DEFAULT: '#14B8A6',
          light: '#5EEAD4',
          dark: '#0F8F80',
        },
        warn: '#F59E0B',
        danger: '#E11D48',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        trajectory:
          'linear-gradient(115deg, rgba(79,60,201,0.14) 0%, rgba(20,184,166,0.10) 55%, transparent 80%)',
      },
      keyframes: {
        rise: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        drawline: {
          '0%': { strokeDashoffset: '600' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        rise: 'rise 0.5s ease-out both',
        drawline: 'drawline 1.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
