/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinex: {
          purple: {
            DEFAULT: '#a700ff',
            dark: '#330054',
            darker: '#311b3c',
          },
          magenta: '#ea0cac',
          blue: '#312783',
        }
      }
    },
  },
  plugins: [],
};
