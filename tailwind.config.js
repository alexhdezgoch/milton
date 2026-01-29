/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        milton: {
          green: {
            50: '#e6f2ec',
            100: '#b3d9c4',
            200: '#80c09c',
            300: '#4da774',
            400: '#1a8e4c',
            500: '#006633',
            600: '#004225',
            700: '#00351e',
            800: '#002816',
            900: '#001b0f',
            950: '#000f08',
          },
          pink: {
            50: '#fff0f5',
            100: '#ffd6e5',
            200: '#ffbdd4',
            300: '#ffa3c4',
            400: '#ff89b3',
            500: '#FF6B9D',
            600: '#e55a8a',
            700: '#cc4a77',
            800: '#b23964',
            900: '#992951',
          },
        },
      },
      animation: {
        'snip-pulse': 'snip-pulse 0.6s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'snip-pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'accordion-down': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--accordion-height)', opacity: '1' },
        },
        'accordion-up': {
          '0%': { height: 'var(--accordion-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
