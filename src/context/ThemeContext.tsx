// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Theme type ကို သတ်မှတ်ခြင်း
type Theme = 'light' | 'dark';

// Context ကနေ ပေးမယ့် value တွေရဲ့ type
interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isThemeLoading: boolean; // Theme ကို စ load နေချိန် true ဖြစ်မယ့် state
}

// Context ကို ဖန်တီးခြင်း
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Provider component အတွက် props type
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme class ကို <html> element မှာ ထည့်/ဖြုတ် လုပ်မယ့် helper function
const applyThemeToDocument = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    // console.log(`Applied theme to HTML: ${theme}`);
  }
};

// --- START: Default ကို 'dark' ဖြစ်အောင် ပြင်ဆင် ---
// Component စဖွင့်ချိန်မှာ ဘယ် theme ကို အရင်သုံးမလဲ ဆုံးဖြတ်တဲ့ helper function
// (localStorage -> DB preference (if logged in) -> OS preference -> default 'dark')
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        // console.log("Initial theme from localStorage:", storedTheme);
        return storedTheme;
      }
      // OS preference ကို မစစ်ခင် default ကို dark လို့ အရင် သတ်မှတ်ကြည့်ပါ
      // const osPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      // console.log("Initial theme from OS preference:", osPreference);
      // return osPreference;
    } catch (e) {
      console.error("Error accessing localStorage or matchMedia", e);
    }
  }
  // console.log("Initial theme defaulting to dark");
  return 'dark'; // Default ကို 'dark' သတ်မှတ်
};
// --- END: Default ကို 'dark' ဖြစ်အောင် ပြင်ဆင် ---


// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme); // လက်ရှိ theme state
  const [session, setSession] = useState<Session | null>(null); // Supabase session state
  const [isThemeLoading, setIsThemeLoading] = useState(true); // Loading state
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // Initial load ပြီးပြီလား

  // 1. Component mount ဖြစ်ချိန်မှာ အလုပ်လုပ်မယ့် effect (initial theme သတ်မှတ်၊ session စစ်ဆေး)
  useEffect(() => {
    // console.log("ThemeProvider Mount: Setting initial theme and checking session.");
    setIsThemeLoading(true);

    // အရင်ဆုံး client-side မှာ localStorage/OS preference အရ theme ကို သတ်မှတ်ပါ
    const initialClientTheme = getInitialTheme();
    setThemeState(initialClientTheme);
    applyThemeToDocument(initialClientTheme);

    // လက်ရှိ session ကို ယူပါ
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      // console.log("ThemeProvider Mount: Initial session fetched:", !!currentSession);
      if (currentSession?.user) {
        // User ရှိရင် Database က theme preference ကို ဆွဲပါ
        fetchUserThemePreference(currentSession.user);
      } else {
        // User မရှိရင် loading ပြီးပါပြီ
        setIsThemeLoading(false);
        setIsInitialLoadComplete(true);
        // console.log("ThemeProvider Mount: No initial session, loading finished.");
      }
    });

    // Auth state အပြောင်းအလဲကို စောင့်ကြည့်ပါ (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // console.log("ThemeProvider AuthChange: New session:", !!newSession);
        const userChanged = session?.user?.id !== newSession?.user?.id;
        setSession(newSession);

        if (userChanged) { // User ပြောင်းသွားမှသာ (login/logout) theme ကို ပြန်စစ်ပါ
            setIsThemeLoading(true); // Loading စတင်ပါ
            if (newSession?.user) {
              // Login ဖြစ်သွားရင် DB က preference ကို ဆွဲပါ
              // console.log("ThemeProvider AuthChange: User logged in, fetching DB theme.");
              fetchUserThemePreference(newSession.user);
            } else {
              // Logout ဖြစ်သွားရင် localStorage/OS preference ကို ပြန်သုံးပါ
              // console.log("ThemeProvider AuthChange: User logged out, reverting to client theme.");
              const clientTheme = getInitialTheme();
              setThemeState(clientTheme);
              applyThemeToDocument(clientTheme);
              try {
                  localStorage.setItem('theme', clientTheme); // localStorage ကိုပါ update လုပ်ပါ
              } catch (e) {
                   console.error("Error updating localStorage on logout", e);
              }
              setIsThemeLoading(false); // Loading ပြီးပါပြီ
              setIsInitialLoadComplete(true);
            }
        } else if (!newSession?.user && !isInitialLoadComplete) {
            // Edge case: Initial load မှာ session မရှိတာ သေချာသွားရင် loading ကို false လုပ်ပါ
            setIsThemeLoading(false);
            setIsInitialLoadComplete(true);
        }
      }
    );

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount မှာ တစ်ခါပဲ run ပါ


  // 2. User ရဲ့ theme preference ကို Database ကနေ ဆွဲထုတ်မယ့် function
  const fetchUserThemePreference = async (user: User) => {
    // console.log("ThemeProvider: Fetching DB theme preference for user:", user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' (No rows found) error ကို လျစ်လျူရှုပါ
      console.error("ThemeProvider: Error fetching profile preferences:", error);
      setIsThemeLoading(false); // Error ဖြစ်ရင် loading ကို ရပ်ပါ
      setIsInitialLoadComplete(true);
      return;
    }

    const dbTheme = data?.preferences?.theme as Theme | undefined;
    // console.log("ThemeProvider: Fetched DB theme:", dbTheme);

    // DB က preference ရှိရင် အဲ့ဒါကို သုံး၊ မရှိရင် လက်ရှိ client theme (localStorage/OS) ကိုပဲ ဆက်သုံး
    const themeToApply = dbTheme || getInitialTheme(); // <--- Default dark ဖြစ်တဲ့အတွက် ဒီနေရာမှာ မှန်သွားပါလိမ့်မယ်

    setThemeState(themeToApply);
    applyThemeToDocument(themeToApply);
    try {
        localStorage.setItem('theme', themeToApply); // localStorage ကိုပါ update လုပ်ပါ
        // console.log(`ThemeProvider: Applied theme (${dbTheme ? 'from DB' : 'fallback to client'}): ${themeToApply}`);
    } catch (e) {
        console.error("Error updating localStorage after DB fetch", e);
    }
    setIsThemeLoading(false); // Loading ပြီးပါပြီ
    setIsInitialLoadComplete(true);
  };

  // 3. Theme ပြောင်းလဲရန် function (State, localStorage, DB ကို update လုပ်မည်)
  const setTheme = useCallback(async (newTheme: Theme) => {
    // console.log("ThemeProvider: setTheme called with:", newTheme);
    // Optimistic Update: UI ကို ချက်ချင်း update လုပ်ပါ
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);

    // localStorage ကို update လုပ်ပါ
    try {
      localStorage.setItem('theme', newTheme);
      // console.log("ThemeProvider: Saved theme to localStorage:", newTheme);
    } catch (e) {
      console.error("Error saving theme to localStorage", e);
    }

    // User login ဝင်ထားရင် DB ကိုပါ update လုပ်ပါ
    if (session?.user) {
      // console.log("ThemeProvider: Saving theme preference to DB for user:", session.user.id);
      // လက်ရှိ preferences ကို အရင်ဖတ်ပြီးမှ update လုပ်တာ ပိုစိတ်ချရပါတယ်
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("ThemeProvider: Error fetching current preferences before saving:", fetchError);
        return; // Error ဖြစ်ရင် DB update မလုပ်တော့ပါ
      }

      const currentPreferences = profileData?.preferences || {};
      const updatedPreferences = { ...currentPreferences, theme: newTheme };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', session.user.id);

      if (updateError) {
        console.error("ThemeProvider: Error saving theme preference to DB:", updateError);
        // ဒီနေရာမှာ UI ကို အရင်အတိုင်း ပြန်ပြောင်းချင်ရင် ပြောင်းနိုင်ပါတယ် (Rollback)
      } else {
        // console.log("ThemeProvider: Theme preference saved to DB successfully.");
      }
    }
  }, [session]); // session ပြောင်းလဲမှသာ DB update logic ကို အသစ်ပြန်ဖန်တီးပါ

  // Context value ကို useMemo သုံးပြီး optimize လုပ်ပါ
  const value = useMemo(() => ({ theme, setTheme, isThemeLoading }), [theme, setTheme, isThemeLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme context ကို အလွယ်တကူသုံးနိုင်မယ့် custom hook
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};