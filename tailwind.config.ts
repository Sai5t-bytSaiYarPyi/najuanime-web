// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  // --- darkMode: 'class', ကို ဖယ်ရှားလိုက်ပါ ---
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Dark Mode Colors (ယခု Default Theme ဖြစ်သွားပါပြီ) ---
        'background-dark': '#0B0F19',
        'card-dark': '#111827',
        'border-color': '#374151',
        'text-dark-primary': '#F3F4F6',
        'text-dark-secondary': '#9CA3AF',
        'accent-green': '#39FF14',
        'accent-purple': '#A78BFA',
        'accent-blue': '#60A5FA',

        // --- Light Mode Colors ကို ဖယ်ရှားလိုက်ပါ ---
        // 'background-light': '#F9FAFB',
        // 'card-light': '#FFFFFF',
        // 'border-light': '#E5E7EB',
        // 'text-light-primary': '#111827',
        // 'text-light-secondary': '#6B7280',
      },
      backgroundImage: { /* ... */ },
    },
  },
  plugins: [],
};
export default config;