/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gov-blue': '#1d70b8',
        'gov-blue-dark': '#003078',
        'gov-blue-light': '#5694ca',
        'gov-grey': '#f3f2f1',
        'gov-grey-dark': '#6f777b',
        'gov-black': '#0b0c0c',
        'gov-red': '#d4351c',
        'gov-green': '#00703c',
        'gov-yellow': '#ffdd00',
      },
      fontFamily: {
        'gov': ['GDS Transport', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
