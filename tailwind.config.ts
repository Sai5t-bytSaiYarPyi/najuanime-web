// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // <--- ဒါရှိနေရပါမယ်
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Dark Mode Colors ---
        'background-dark': '#0D1117', // Main background color (မှောင်သော)
        'card-dark': '#161B22',       // Card background color (မှောင်သော)
        'border-color': '#30363D',    // Border color (မှောင်သော)
        'text-dark-primary': '#E5E7EB', // Primary text color (ဖြူသော - Gray 200)
        'text-dark-secondary': '#9CA3AF',// Secondary text color (မီးခိုးသော - Gray 400)

        // --- Light Mode Colors ---
        'background-light': '#F9FAFB', // Main background color (အဖြူနီးပါး - Gray 50)
        'card-light': '#FFFFFF',       // Card background color (အဖြူ)
        'border-light': '#E5E7EB',    // Border color (အဖြူရောင်မှိန် - Gray 200)
        'text-light-primary': '#1F2937', // Primary text color (အနက်နီးပါး - Gray 800)
        'text-light-secondary': '#6B7280',// Secondary text color (မီးခိုးရင့် - Gray 500)

        // --- Accent Colors (မပြောင်းလဲ) ---
        'accent-green': '#39FF14',    // Neon green for highlights
        'accent-purple': '#8A2BE2',   // Purple for buttons
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;