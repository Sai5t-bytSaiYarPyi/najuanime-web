// src/components/Auth.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, KeyRound, LogIn, UserPlus, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Discord and Google Icons (Simple SVG for now) ---
const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.36981C18.7915 3.64957 17.1826 3.07824 15.5243 2.66895C15.4212 2.92424 15.3304 3.20336 15.2519 3.49488C13.4379 3.22959 11.5855 3.22959 9.77153 3.49488C9.69299 3.20336 9.60224 2.92424 9.50001 2.66895C7.84172 3.07824 6.23284 3.64957 4.70737 4.36981C2.55959 7.15112 1.54924 9.87342 1.94218 12.5358C3.51139 13.6366 5.02117 14.4984 6.47173 15.131C6.98211 14.4108 7.42293 13.6507 7.7942 12.8668C7.10866 12.4451 6.45267 11.9834 5.84411 11.4819C5.98188 11.3442 6.11964 11.2064 6.24492 11.0687C9.37596 12.8092 12.8224 13.1162 16.0913 12.2458C16.4501 13.006 16.8778 13.7145 17.3483 14.3984C18.8293 13.7658 20.262 12.9163 21.6059 11.75C22.2905 9.3879 21.6838 7.02604 20.317 4.36981ZM8.53173 10.3343C7.72836 10.3343 7.07238 9.67834 7.07238 8.87496C7.07238 8.07159 7.71588 7.41561 8.53173 7.41561C9.34758 7.41561 10.0036 8.07159 10.0036 8.87496C10.0036 9.67834 9.34758 10.3343 8.53173 10.3343ZM15.4808 10.3343C14.6774 10.3343 14.0214 9.67834 14.0214 8.87496C14.0214 8.07159 14.6649 7.41561 15.4808 7.41561C16.2966 7.41561 16.9526 8.07159 16.9526 8.87496C16.9526 9.67834 16.2966 10.3343 15.4808 10.3343Z" /></svg>
);

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.8182 10.1818H22V10H12V14H17.4545C17.0367 15.5427 15.8258 16.7633 14.3182 17.3182V20H17.1818C19.9696 17.6767 21.8182 14.3333 21.8182 10.1818Z" fill="#4285F4"></path><path d="M12 22C14.9545 22 17.4545 21.0455 19.1818 19.4545L16.3182 17.3182C15.3182 18 14.0909 18.4545 12 18.4545C9.27273 18.4545 6.95455 16.6364 6.09091 14.2727H3.09091V16.5455C4.72727 19.8182 8.09091 22 12 22Z" fill="#34A853"></path><path d="M6.09091 14.2727C5.81818 13.5 5.68182 12.6818 5.68182 11.8182C5.68182 10.9545 5.81818 10.1364 6.09091 9.36364V7.09091H3.09091C2.31818 8.63636 1.81818 10.1818 1.81818 11.8182C1.81818 13.4545 2.31818 15 3.09091 16.5455L6.09091 14.2727Z" fill="#FBBC05"></path><path d="M12 5.18182C13.5455 5.18182 14.8636 5.68182 15.9545 6.72727L18.6818 4C16.8636 2.31818 14.5909 1.36364 12 1.36364C8.09091 1.36364 4.72727 3.81818 3.09091 7.09091L6.09091 9.36364C6.95455 6.95455 9.27273 5.18182 12 5.18182Z" fill="#EA4335"></path></svg>
);


interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Auth({ isOpen, onClose }: AuthProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLoginView) {
      // Login Logic
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        onClose(); // Close modal on successful login
      }
    } else {
      // Sign Up Logic
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Pass username to be used in the trigger
          }
        }
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user && data.user.identities?.length === 0) {
        setError("This email is already in use. Please try logging in.");
      }
      else {
        setMessage('Registration successful! Please check your email to verify your account.');
        // Don't close, let user see the message
      }
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative w-full max-w-md bg-card-dark/80 border border-border-color rounded-2xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold text-center text-white mb-2">
              {isLoginView ? 'Welcome Back!' : 'Join the Universe'}
            </h2>
            <p className="text-gray-400 text-center mb-6">
              {isLoginView ? 'Log in to continue your journey.' : 'Create an account to get started.'}
            </p>

            {/* Social Logins */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => handleSocialLogin('google')}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
              >
                <GoogleIcon /> Google
              </button>
              <button
                onClick={() => handleSocialLogin('discord')}
                className="flex-1 flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
              >
                <DiscordIcon /> Discord
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <hr className="flex-1 border-border-color" />
              <span className="text-gray-400 text-sm">OR</span>
              <hr className="flex-1 border-border-color" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLoginView && (
                 <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>

              {/* Error/Message Display */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-2 rounded-md">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
                {message && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 p-2 rounded-md">
                    <span>{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>


              <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')}
                <LogIn size={20} />
              </button>
            </form>

            {/* Toggle View */}
            <p className="text-center text-sm text-gray-400 mt-6">
              {isLoginView ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setError(null);
                  setMessage(null);
                }}
                className="font-semibold text-accent-green hover:text-green-400 ml-1"
              >
                {isLoginView ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}