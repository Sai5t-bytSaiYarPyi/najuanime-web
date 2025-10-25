// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Placeholder context - ဘာမှမလုပ်ဆောင်ပါ
const ThemeContext = createContext<undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Placeholder Provider - children ကိုသာ render လုပ်ပါ
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return <>{children}</>;
};

// Placeholder Hook - Error မတက်အောင်သာ ထားထားသည်
export const useTheme = () => {
  // ဒီ function ကို ခေါ်တဲ့နေရာတွေကို ဖယ်ရှားရပါမည်
  console.warn("useTheme is called but Theme functionality is removed.");
  return {
    theme: 'dark', // Default value or undefined
    setTheme: () => {}, // Dummy function
    isThemeLoading: false // Default value
  };
};