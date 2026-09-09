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
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981', // Cineplex primary green
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        cinema: {
          bg: '#f8fafc',
          card: '#ffffff',
          surface: '#f1f5f9',
          border: '#e2e8f0',
          gold: '#d97706',
          accent: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
