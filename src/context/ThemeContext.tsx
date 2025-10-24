// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean; // Theme loading state
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Helper function to apply theme class
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    console.log(`Theme applied to HTML: ${theme}`);
  }
};

// Helper function to get initial theme
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default server-side or non-browser environment
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [session, setSession] = useState<Session | null>(null);
  const [dbTheme, setDbTheme] = useState<Theme | null>(null); // Theme from DB
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial theme setup

  // --- 1. Initial Setup: Set session and apply initial theme ---
  useEffect(() => {
    console.log("ThemeProvider: Initializing...");
    setIsLoading(true);

    // Apply initial theme based on localStorage/OS preference first
    const initialClientTheme = getInitialTheme();
    setThemeState(initialClientTheme);
    applyTheme(initialClientTheme);
    console.log("ThemeProvider: Applied initial client theme:", initialClientTheme);

    // Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      console.log("ThemeProvider: Initial session fetched:", !!currentSession);
      // Fetch DB theme only if session exists
      if (currentSession?.user) {
        fetchUserThemePreference(currentSession.user);
      } else {
        setIsLoading(false); // No user, finish loading
        console.log("ThemeProvider: No initial session, loading finished.");
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("ThemeProvider: Auth state changed. New session:", !!newSession);
        setSession(newSession);
        if (newSession?.user) {
           setIsLoading(true); // Start loading when user logs in
           fetchUserThemePreference(newSession.user);
        } else {
           // User logged out, revert to localStorage/OS preference
           const clientTheme = getInitialTheme();
           setThemeState(clientTheme);
           applyTheme(clientTheme);
           setDbTheme(null); // Clear DB theme state
           setIsLoading(false); // Finish loading after logout
           console.log("ThemeProvider: User logged out, reverted to client theme:", clientTheme);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. Fetch User Theme Preference ---
  const fetchUserThemePreference = async (user: User) => {
      console.log("ThemeProvider: Fetching theme preference for user:", user.id);
      const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'not found' error temporarily
          console.error("ThemeProvider: Error fetching profile preferences:", error);
      }

      const fetchedTheme = data?.preferences?.theme;
      console.log("ThemeProvider: Theme preference from DB:", fetchedTheme);
      setDbTheme(fetchedTheme || null);

      // Apply DB theme if it exists and differs from current (localStorage/OS)
      const currentClientTheme = getInitialTheme();
      const themeToApply = fetchedTheme || currentClientTheme;

      if (theme !== themeToApply) {
          setThemeState(themeToApply);
          applyTheme(themeToApply);
          console.log("ThemeProvider: Applied theme from DB:", themeToApply);
           try {
               localStorage.setItem('theme', themeToApply); // Sync localStorage
           } catch (e) {
               console.error("Error updating localStorage after fetching DB theme", e);
           }
      }
      setIsLoading(false); // Finish loading after fetching/applying DB theme
      console.log("ThemeProvider: Finished loading DB theme preference.");
  };


  // --- 3. setTheme Function: Update state, localStorage, and DB ---
  const setTheme = useCallback(async (newTheme: Theme) => {
    console.log("ThemeProvider: setTheme called with:", newTheme);
    // Optimistic UI update
    setThemeState(newTheme);
    applyTheme(newTheme);

    try {
      localStorage.setItem('theme', newTheme);
      console.log("ThemeProvider: Saved theme to localStorage:", newTheme);
    } catch (e) {
      console.error("Error saving theme to localStorage", e);
    }

    // Update DB if user is logged in
    if (session?.user) {
      console.log("ThemeProvider: Saving theme preference to DB for user:", session.user.id);
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("ThemeProvider: Error fetching preferences before saving:", fetchError);
        // Optional: revert optimistic UI update?
        return;
      }

      const currentPreferences = profileData?.preferences || {};
      const updatedPreferences = { ...currentPreferences, theme: newTheme };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', session.user.id);

      if (updateError) {
        console.error("ThemeProvider: Error saving theme preference to DB:", updateError);
        // Optional: revert optimistic UI update?
      } else {
        console.log("ThemeProvider: Theme preference saved to DB successfully.");
        setDbTheme(newTheme); // Update local DB theme state
      }
    }
  }, [session, theme]); // Add theme to dependencies to ensure comparison works correctly

  // Prevent rendering children until initial theme is determined and applied
  // This helps prevent theme flickering on initial load or after login/logout
  // if (isLoading) {
  //    return null; // or a loading spinner maybe? Returning null might cause hydration issues.
  //                 // Let's allow rendering but the theme class might switch quickly.
  // }


  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
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