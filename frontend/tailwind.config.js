/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#1b4d3e',
        sage: '#87a96b',
        offwhite: '#f9f9f6',
      },
    },
  },
  plugins: [],
}