// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Dark Mode Colors (Default Theme) ---
        'background-dark': '#0B0F19', // ပိုနက်ပြာသော နောက်ခံ
        'card-dark': '#111827',       // နက်ပြာရောင်မှိန် Card (Gray 900)
        'border-color': '#374151',    // Border အရောင် (Gray 700)
        'text-dark-primary': '#F3F4F6', // Primary text (Gray 100)
        'text-dark-secondary': '#9CA3AF',// Secondary text (Gray 400)
        'accent-green': '#39FF14',    // Neon green (မပြောင်း)
        'accent-purple': '#A78BFA',   // ပိုဖျော့သော ခရမ်းရောင် (Violet 400) - Button အတွက်
        'accent-blue': '#60A5FA',     // အပြာရောင် (Blue 400) - Link/Hover အတွက်

        // --- Light Mode Colors ---
        'background-light': '#F9FAFB', // Main background color (Gray 50)
        'card-light': '#FFFFFF',       // Card background color (White)
        'border-light': '#E5E7EB',    // Border color (Gray 200)
        'text-light-primary': '#111827', // Primary text color (Gray 900)
        'text-light-secondary': '#6B7280',// Secondary text color (Gray 500)
        // Light mode accent တွေကို Dark mode နဲ့ တူအောင်ထားနိုင်သလို၊ လိုအပ်ရင် ပြင်နိုင်ပါတယ်
        // 'accent-green-light': '#16A34A', // Green 600
        // 'accent-purple-light': '#7C3AED', // Violet 600
        // 'accent-blue-light': '#2563EB',   // Blue 600
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