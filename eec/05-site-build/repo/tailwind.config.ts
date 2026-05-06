import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F1B2D',
          secondary: '#F5F5F2',
          accent: '#FF6B35',
          'neutral-1': '#2D3748',
          'neutral-2': '#A0AEC0',
          'neutral-3': '#E2E8F0'
        }
      },
      fontFamily: {
        display: ['"Inter Display"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.32, 0.72, 0, 1)'
      }
    }
  },
  plugins: []
};

export default config;
