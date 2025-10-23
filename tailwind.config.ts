// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // <--- ဒီလိုင်းကို ထည့်ပါ သို့မဟုတ် ပြင်ပါ
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'background-dark': '#0D1117',
        'card-dark': '#161B22',
        'accent-green': '#39FF14',
        'accent-purple': '#8A2BE2',
        'border-color': '#30363D',
        // --- START: Light Mode အရောင်များ (ဥပမာ) ---
        'background-light': '#F3F4F6', // Example light background
        'card-light': '#FFFFFF',       // Example light card
        'text-light-primary': '#1F2937', // Example light text primary
        'text-light-secondary': '#6B7280', // Example light text secondary
        'border-light': '#D1D5DB'       // Example light border
        // --- END: Light Mode အရောင်များ ---
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config