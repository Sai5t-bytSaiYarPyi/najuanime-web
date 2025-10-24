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

// Component စဖွင့်ချိန်မှာ ဘယ် theme ကို အရင်သုံးမလဲ ဆုံးဖြတ်တဲ့ helper function
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        // console.log("Initial theme from localStorage:", storedTheme);
        return storedTheme;
      }
    } catch (e) {
      console.error("Error accessing localStorage", e);
    }
  }
  // console.log("Initial theme defaulting to dark");
  return 'dark'; // Default ကို 'dark' သတ်မှတ်
};

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme); // လက်ရှိ theme state
  const [session, setSession] = useState<Session | null>(null); // Supabase session state
  const [isThemeLoading, setIsThemeLoading] = useState(true); // Loading state
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // Initial load ပြီးပြီလား

  // 1. Component mount ဖြစ်ချိန်မှာ အလုပ်လုပ်မယ့် effect (initial theme သတ်မှတ်၊ session စစ်ဆေး)
  useEffect(() => {
    console.log("[ThemeContext] Mount: Setting initial theme and checking session."); // LOG ADDED
    setIsThemeLoading(true);

    const initialClientTheme = getInitialTheme();
    setThemeState(initialClientTheme);
    applyThemeToDocument(initialClientTheme);
    console.log("[ThemeContext] Mount: Applied initial client theme:", initialClientTheme); // LOG ADDED

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      console.log("[ThemeContext] Mount: Initial session fetched:", !!currentSession); // LOG ADDED
      if (currentSession?.user) {
        fetchUserThemePreference(currentSession.user);
      } else {
        setIsThemeLoading(false); // LOGGING POINT
        setIsInitialLoadComplete(true);
        console.log("[ThemeContext] Mount: No initial session, loading finished. isThemeLoading=false"); // LOG ADDED
      }
    }).catch(error => { // Added catch block for getSession
        console.error("[ThemeContext] Mount: Error getting initial session:", error);
        setIsThemeLoading(false); // LOGGING POINT
        setIsInitialLoadComplete(true);
        console.log("[ThemeContext] Mount: Error getting session, loading finished. isThemeLoading=false"); // LOG ADDED
    });


    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("[ThemeContext] AuthChange: Event:", _event, "New session:", !!newSession); // LOG ADDED
        const userChanged = session?.user?.id !== newSession?.user?.id;
        setSession(newSession);

        if (userChanged) {
            console.log("[ThemeContext] AuthChange: User changed. isThemeLoading=true"); // LOG ADDED
            setIsThemeLoading(true);
            if (newSession?.user) {
              console.log("[ThemeContext] AuthChange: User logged in, fetching DB theme."); // LOG ADDED
              fetchUserThemePreference(newSession.user);
            } else {
              console.log("[ThemeContext] AuthChange: User logged out, reverting to client theme."); // LOG ADDED
              const clientTheme = getInitialTheme();
              setThemeState(clientTheme);
              applyThemeToDocument(clientTheme);
              try { localStorage.setItem('theme', clientTheme); } catch (e) {}
              setIsThemeLoading(false); // LOGGING POINT
              setIsInitialLoadComplete(true);
              console.log("[ThemeContext] AuthChange: User logged out, loading finished. isThemeLoading=false"); // LOG ADDED
            }
        } else if (!newSession?.user && !isInitialLoadComplete) {
            setIsThemeLoading(false); // LOGGING POINT
            setIsInitialLoadComplete(true);
             console.log("[ThemeContext] AuthChange: No session after initial check, loading finished. isThemeLoading=false"); // LOG ADDED
        } else {
            console.log("[ThemeContext] AuthChange: Auth event without user change, state unchanged."); // LOG ADDED
        }
      }
    );

    return () => {
      console.log("[ThemeContext] Unmount: Unsubscribing auth listener."); // LOG ADDED
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount မှာ တစ်ခါပဲ run ပါ


  // 2. User ရဲ့ theme preference ကို Database ကနေ ဆွဲထုတ်မယ့် function
  const fetchUserThemePreference = async (user: User) => {
    console.log("[ThemeContext] FetchDB: Fetching for user:", user.id); // LOG ADDED
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("[ThemeContext] FetchDB: Error fetching profile preferences:", error);
          throw error; // Throw error to be caught below
        }

        const dbTheme = data?.preferences?.theme as Theme | undefined;
        console.log("[ThemeContext] FetchDB: Fetched DB theme:", dbTheme); // LOG ADDED

        const themeToApply = dbTheme || getInitialTheme();

        setThemeState(themeToApply);
        applyThemeToDocument(themeToApply);
        try { localStorage.setItem('theme', themeToApply); } catch (e) {}
        console.log(`[ThemeContext] FetchDB: Applied theme (${dbTheme ? 'from DB' : 'fallback'}) ${themeToApply}. isThemeLoading=false`); // LOG ADDED

    } catch (fetchError) {
         console.error("[ThemeContext] FetchDB: Catch block error:", fetchError); // LOG ADDED
         // Error ဖြစ်ရင်တောင် client theme ကို သုံးပြီး loading ကို ရပ်ပါ
         const clientTheme = getInitialTheme();
         setThemeState(clientTheme);
         applyThemeToDocument(clientTheme);
         try { localStorage.setItem('theme', clientTheme); } catch (e) {}
         console.log("[ThemeContext] FetchDB: Error occurred, applied client theme", clientTheme, ". isThemeLoading=false"); // LOG ADDED
    } finally {
        setIsThemeLoading(false); // LOGGING POINT
        setIsInitialLoadComplete(true); // Initial load ပြီးပြီလို့ သတ်မှတ်
         console.log("[ThemeContext] FetchDB: Finally block executed. isThemeLoading=false"); // LOG ADDED
    }
  };


  // 3. Theme ပြောင်းလဲရန် function (State, localStorage, DB ကို update လုပ်မည်)
  const setTheme = useCallback(async (newTheme: Theme) => {
    // console.log("[ThemeContext] SetTheme: Setting theme to:", newTheme); // LOG ADDED (optional)
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
    try { localStorage.setItem('theme', newTheme); } catch (e) {}

    if (session?.user) {
      // console.log("[ThemeContext] SetTheme: Saving to DB..."); // LOG ADDED (optional)
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', session.user.id)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') { return; }
      const currentPreferences = profileData?.preferences || {};
      const updatedPreferences = { ...currentPreferences, theme: newTheme };
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', session.user.id);
      if (updateError) { console.error("[ThemeContext] SetTheme: Error saving to DB:", updateError); }
      // else { console.log("[ThemeContext] SetTheme: Saved to DB successfully."); } // LOG ADDED (optional)
    }
  }, [session]);

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