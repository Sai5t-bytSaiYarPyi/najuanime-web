// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  // darkMode: 'class', // ဒီလိုင်းကို ဖယ်ထားပြီးသား
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- အရောင် Palette အသစ် ---
        'background': '#0B0C10',       // အရမ်းနက်တဲ့ အပြာနက်ရောင်
        'card': '#1F2833',             // မီးခိုးပြာရောင်အမှိန်
        'border': '#45A29E',           // အနည်းငယ်တောက်သော Cyan (Border အတွက်)
        'text-primary': '#C5C6C7',     // အဖြူရောင်မှိန်
        'text-secondary': '#66FCF1',    // တောက်ပသော Cyan (Secondary Text အတွက်)

        // --- Accent Colors အသစ် ---
        'accent-1': '#66FCF1',         // တောက်ပသော Cyan (Primary Accent)
        'accent-2': '#C4146F',         // တောက်ပသော Magenta/Pink (Secondary Accent)

        // --- Compatibility အတွက် အရင် Accent Name တွေကိုလည်း ထားပေးနိုင်ပါတယ် ---
        'accent-green': '#66FCF1',     // Cyan ကိုသုံးမယ်
        'accent-purple': '#66FCF1',    // Cyan ကိုသုံးမယ် (Primary Button အတွက်)
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