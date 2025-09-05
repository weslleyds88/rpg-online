/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rpg-gold': '#FFD700',
        'rpg-red': '#DC2626',
        'rpg-blue': '#2563EB',
        'rpg-green': '#16A34A',
        'rpg-purple': '#7C3AED',
        'rpg-dark': '#1F2937',
        'rpg-darker': '#111827'
      },
      fontFamily: {
        'fantasy': ['Cinzel', 'serif'],
        'sans': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
