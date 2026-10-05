/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(14,165,233,0.2), 0 25px 50px -12px rgba(15,118,110,0.4)',
      },
    },
  },
  plugins: [],
};
