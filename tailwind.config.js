/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6E57E0',
          'purple-hover': '#285BD4',
          cyan: '#00C9FF',
          neon: '#12F7FF',
          gold: '#C0A631',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 15px rgba(18, 247, 255, 0.4)',
        glow: '0 0 25px rgba(110, 87, 224, 0.35)',
      },
      keyframes: {
        imgFloat: {
          '0%, 100%': { transform: 'translateY(0px)', borderRadius: '55% 45% 55% 45%' },
          '50%': { transform: 'translateY(-12px)', borderRadius: '45% 55% 45% 55%' },
        },
      },
      animation: {
        imgFloat: 'imgFloat 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
