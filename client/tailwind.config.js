/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#dceee5',
          200: '#bbdcce',
          300: '#8ec4af',
          400: '#5fa78c',
          500: '#3f8b70',
          600: '#2e6f59',
          700: '#275a49',
          800: '#1a2f23',
          900: '#0d1f17',
        },
        gold: {
          400: '#e6b858',
          500: '#d4a84b',
          600: '#b8923f',
        },
        faction: {
          ironwood: '#d97706',
          eyrie: '#3b82f6',
          alliance: '#10b981',
          wanderer: '#6b7280',
        }
      },
      fontFamily: {
        display: ['Crimson Pro', 'serif'],
        body: ['Vollkorn', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
