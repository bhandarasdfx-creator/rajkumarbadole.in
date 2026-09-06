/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#092b45',
          navyDark: '#051929',
          navyLight: '#0e3d61',
          saffron: '#ff7722',
          amber: '#f59e0b',
          green: '#10b981',
          slate: '#f8fafc',
          dark: '#0a0f1d'
        }
      },
      fontFamily: {
        marathi: ['"Mukta"', '"Noto Sans Devanagari"', 'sans-serif'],
        sans: ['"Inter"', '"Mukta"', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
