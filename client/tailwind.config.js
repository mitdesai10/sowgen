/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          500: '#3b5bdb',
          600: '#2f4ac7',
          700: '#2541b8',
          800: '#1e2a4a',
          900: '#141d35',
        }
      }
    }
  },
  plugins: [],
}
