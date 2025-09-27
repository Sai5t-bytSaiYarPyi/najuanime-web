// src/components/withSubscription.tsx
'use client';
import { useEffect, useState, ComponentType, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import AccessDenied from './AccessDenied';

const withSubscription = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithSubscriptionComponent = (props: P) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkSubscription = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_expires_at') // We only need the expiry date
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }
        
        // --- START OF FIX ---
        // The ONLY condition we check now is if the expiry date is in the future.
        // We no longer check the 'subscription_status' column for access control.
        const isNotExpired = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

        if (isNotExpired) {
          setIsSubscribed(true);
        }
        // --- END OF FIX ---
        
        setLoading(false);
      };

      checkSubscription();
    }, []);

    if (loading) {
      return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Checking your subscription...</div>;
    }

    if (!isSubscribed) {
      return <AccessDenied />;
    }

    return <WrappedComponent {...props} />;
  };

  return WithSubscriptionComponent;
};

export default withSubscription;