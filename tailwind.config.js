/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./script.js"],
  theme: {
    extend: {
      colors: {
        retroBg: '#0b0f19',
        retroPanel: '#111827',
        retroBorder: '#1f2937',
        retroAmber: '#f59e0b',
        retroAmberHover: '#d97706',
        retroGreen: '#22c55e'
      },
      fontFamily: {
        pixel: ['"VT323"', 'monospace'],
        mono: ['"Share Tech Mono"', 'monospace']
      }
    }
  },
  plugins: [],
}