/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: '#00FFE7', // Vibrant cyan
        dark: '#0A0A0A',    // Near-black
        accent: '#00B8D9',  // Stripe-like blue-cyan
      },
    },
  },
  plugins: [],
} 