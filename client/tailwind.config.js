/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#eeebf8',
          100: '#d3cce6',
          200: '#b8add4',
          300: '#9d8ec2',
          400: '#826fb0',
          500: '#6e43f0',
          600: '#5c37d0',
          700: '#4a2bb0',
          800: '#381f90',
          900: '#261370',
          950: '#140750',
        },
      },
    },
  },
  plugins: [],
}
