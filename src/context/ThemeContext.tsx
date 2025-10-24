// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode, useMemo, useRef } from 'react'; // useRef ထည့်ပါ
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isThemeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
};

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') { return storedTheme; }
    } catch (e) {}
  }
  return 'dark';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [session, setSession] = useState<Session | null>(null);
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const previousUserIdRef = useRef<string | null | undefined>(undefined); // ယခင် user ID ကို မှတ်ထားရန် Ref

  // Fetch User Theme Preference (ယခင်အတိုင်း)
  const fetchUserThemePreference = useCallback(async (user: User) => {
    console.log("[ThemeContext] FetchDB: Fetching for user:", user.id);
    // --- START: Loading state ကို အစမှာ true လုပ်ပါ ---
    setIsThemeLoading(true);
    // --- END: Loading state ကို အစမှာ true လုပ်ပါ ---
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("[ThemeContext] FetchDB: Error fetching profile preferences:", error);
          throw error;
        }
        const dbTheme = data?.preferences?.theme as Theme | undefined;
        console.log("[ThemeContext] FetchDB: Fetched DB theme:", dbTheme);
        const themeToApply = dbTheme || getInitialTheme();

        setThemeState(themeToApply);
        applyThemeToDocument(themeToApply);
        try { localStorage.setItem('theme', themeToApply); } catch (e) {}
        console.log(`[ThemeContext] FetchDB: Applied theme (${dbTheme ? 'from DB' : 'fallback'}) ${themeToApply}. isThemeLoading=false`);

    } catch (fetchError) {
         console.error("[ThemeContext] FetchDB: Catch block error:", fetchError);
         const clientTheme = getInitialTheme();
         setThemeState(clientTheme);
         applyThemeToDocument(clientTheme);
         try { localStorage.setItem('theme', clientTheme); } catch (e) {}
         console.log("[ThemeContext] FetchDB: Error occurred, applied client theme", clientTheme, ". isThemeLoading=false");
    } finally {
        setIsThemeLoading(false); // --- Finally မှာ false ပြန်လုပ် ---
         console.log("[ThemeContext] FetchDB: Finally block executed. isThemeLoading=false");
    }
  }, []); // <-- dependency မလိုပါ

  // Initial Setup and Auth Listener Effect
  useEffect(() => {
    console.log("[ThemeContext] Mount: Setting initial theme and checking session.");
    setIsThemeLoading(true);

    const initialClientTheme = getInitialTheme();
    setThemeState(initialClientTheme);
    applyThemeToDocument(initialClientTheme);
    console.log("[ThemeContext] Mount: Applied initial client theme:", initialClientTheme);

    let initialSessionChecked = false; // Initial session check ပြီးပြီလား မှတ်ရန်

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("[ThemeContext] Mount: Initial session fetched:", !!currentSession);
      initialSessionChecked = true;
      setSession(currentSession);
      previousUserIdRef.current = currentSession?.user?.id ?? null; // Initial user ID ကို Ref မှာ မှတ်ပါ
      if (currentSession?.user) {
        fetchUserThemePreference(currentSession.user);
      } else {
        setIsThemeLoading(false);
        console.log("[ThemeContext] Mount: No initial session, loading finished. isThemeLoading=false");
      }
    }).catch(error => {
        initialSessionChecked = true;
        previousUserIdRef.current = null; // Error မှာ null ထား
        console.error("[ThemeContext] Mount: Error getting initial session:", error);
        setIsThemeLoading(false);
        console.log("[ThemeContext] Mount: Error getting session, loading finished. isThemeLoading=false");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("[ThemeContext] AuthChange: Event:", _event, "New session:", !!newSession);

        // Initial session check မပြီးသေးရင် ဘာမှမလုပ်ပါ (duplicate call ကာကွယ်ရန်)
        if (!initialSessionChecked) {
            console.log("[ThemeContext] AuthChange: Initial session check not complete, skipping event.");
            return;
        }

        const newUserId = newSession?.user?.id ?? null;
        const previousUserId = previousUserIdRef.current;

        // User ID အမှန်တကယ် ပြောင်းမှသာ လုပ်ဆောင်ပါ
        if (newUserId !== previousUserId) {
            console.log(`[ThemeContext] AuthChange: User changed (Previous: ${previousUserId}, New: ${newUserId}).`);
            setSession(newSession); // Session state ကို update လုပ်ပါ
            previousUserIdRef.current = newUserId; // Ref ကို update လုပ်ပါ
            setIsThemeLoading(true); // Loading စတင်ပါ
            if (newUserId) {
              console.log("[ThemeContext] AuthChange: User logged in, fetching DB theme.");
              fetchUserThemePreference(newSession!.user); // User ရှိမှ fetch လုပ်
            } else {
              console.log("[ThemeContext] AuthChange: User logged out, reverting to client theme.");
              const clientTheme = getInitialTheme();
              setThemeState(clientTheme);
              applyThemeToDocument(clientTheme);
              try { localStorage.setItem('theme', clientTheme); } catch (e) {}
              setIsThemeLoading(false);
              console.log("[ThemeContext] AuthChange: User logged out, loading finished. isThemeLoading=false");
            }
        } else {
            console.log("[ThemeContext] AuthChange: User ID unchanged, skipping theme fetch.");
        }
      }
    );

    return () => {
      console.log("[ThemeContext] Unmount: Unsubscribing auth listener.");
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserThemePreference]); // fetchUserThemePreference ကို dependency ထည့်ပါ


  // Set Theme Function (ယခင်အတိုင်း)
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
    try { localStorage.setItem('theme', newTheme); } catch (e) {}
    if (session?.user) {
      const { data: profileData, error: fetchError } = await supabase.from('profiles').select('preferences').eq('id', session.user.id).single();
      if (fetchError && fetchError.code !== 'PGRST116') { return; }
      const currentPreferences = profileData?.preferences || {};
      const updatedPreferences = { ...currentPreferences, theme: newTheme };
      const { error: updateError } = await supabase.from('profiles').update({ preferences: updatedPreferences }).eq('id', session.user.id);
      if (updateError) { console.error("[ThemeContext] SetTheme: Error saving to DB:", updateError); }
    }
  }, [session]);

  const value = useMemo(() => ({ theme, setTheme, isThemeLoading }), [theme, setTheme, isThemeLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};