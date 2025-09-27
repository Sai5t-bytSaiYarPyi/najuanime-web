// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // --- START: ADD THESE NEW COLORS ---
      colors: {
        'background-dark': '#0D1117', // Main background color
        'card-dark': '#161B22',       // Card background color
        'accent-green': '#39FF14',    // Neon green for highlights
        'accent-purple': '#8A2BE2',   // Purple for buttons
        'border-color': '#30363D',    // Border color for cards
      },
      // --- END: ADD THESE NEW COLORS ---
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