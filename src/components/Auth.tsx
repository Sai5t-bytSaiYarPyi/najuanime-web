// src/components/Auth.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, KeyRound, LogIn, UserPlus, X, AlertCircle, Phone, Hash, Send, Eye, EyeOff, CheckSquare, Square } from 'lucide-react'; // Eye, EyeOff, CheckSquare, Square icons ထည့်သွင်းထားသည်
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'; // Terms အတွက် Link ထည့်သွင်း

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Auth({ isOpen, onClose }: AuthProps) {
  // View Management State
  const [view, setView] = useState<'email' | 'phone' | 'otp' | 'forgot_password'>('email');
  const [isLoginView, setIsLoginView] = useState(true);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Password မြင်ရ/မမြင်ရ state
  const [rememberMe, setRememberMe] = useState(false); // Remember Me state
  const [agreedToTerms, setAgreedToTerms] = useState(false); // Terms state

  // Helper States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetStates = (keepEmail = false) => { // keepEmail option ထပ်ထည့်
    if (!keepEmail) setEmail('');
    setPassword('');
    setUsername('');
    setPhone('');
    setOtp('');
    setShowPassword(false);
    setRememberMe(false);
    setAgreedToTerms(false);
    setError(null);
    setMessage(null);
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLoginView) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
      else onClose(); // အောင်မြင်ရင် modal ပိတ်
    } else { // Signup view
      if (!agreedToTerms) { // Terms ကို လက်မခံထားရင် error ပြ
        setError('You must agree to the Terms of Service and Privacy Policy.');
        setLoading(false);
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user && data.user.identities?.length === 0) {
        setError("This email is already in use. Please try logging in.");
      } else {
        setMessage('Registration successful! Please check your email to verify your account.');
        // အောင်မြင်ရင် Email field ကလွဲပြီး ကျန်တာရှင်းထုတ်
        resetStates(true); // Keep email
        setIsLoginView(true); // Login view ကို ပြန်ပြောင်း
      }
    }
    setLoading(false);
  };

  const handlePhoneSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formattedPhone = phone.startsWith('+') ? phone : `+95${phone.substring(1)}`;
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (otpError) setError(otpError.message);
    else { setView('otp'); setMessage('An OTP has been sent to your phone.'); }
    setLoading(false);
  };

  const handleOtpVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formattedPhone = phone.startsWith('+') ? phone : `+95${phone.substring(1)}`;
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' });
    if (verifyError) setError(verifyError.message);
    else onClose(); // အောင်မြင်ရင် modal ပိတ်
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (resetError) setError(resetError.message);
    else setMessage('Password reset link has been sent to your email.');
    setLoading(false);
  };

  const handleClose = () => {
    resetStates();
    setView('email');
    setIsLoginView(true);
    onClose();
  };

  const renderEmailView = () => (
    <motion.div key="email" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-2">
        {isLoginView ? 'Welcome Back!' : 'Join the Universe'}
      </h2>
      <p className="text-gray-400 text-center mb-6">
        {isLoginView ? 'Log in to continue your journey.' : 'Create an account to get started.'}
      </p>
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {!isLoginView && (
          <div className="relative"><UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
        )}
        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showPassword ? 'text' : 'password'} // Show/Hide logic
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {isLoginView && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="hidden" />
              {rememberMe ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />}
              Remember Me
            </label>
            <button type="button" onClick={() => { setView('forgot_password'); resetStates(true); }} className="text-sm text-gray-400 hover:text-accent-green">Forgot Password?</button>
          </div>
        )}

        {!isLoginView && (
          <div className="flex items-start gap-2">
             <label htmlFor="terms" className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer mt-1">
                <input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="hidden" />
                {agreedToTerms ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />}
             </label>
            <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">
              I agree to the{' '}
              <Link href="/terms" target="_blank" className="text-accent-green hover:underline">Terms of Service</Link> and{' '}
              <Link href="/privacy" target="_blank" className="text-accent-green hover:underline">Privacy Policy</Link>.
            </label>
          </div>
        )}

        <button type="submit" disabled={loading || (!isLoginView && !agreedToTerms)} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">{loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')} <LogIn size={20} /></button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-4">
        <button onClick={() => { setView('phone'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Sign in with Phone Number</button>
      </p>
      <p className="text-center text-sm text-gray-400 mt-2">
        {isLoginView ? "Don't have an account?" : "Already have an account?"}
        <button onClick={() => { setIsLoginView(!isLoginView); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400 ml-1">{isLoginView ? 'Sign Up' : 'Log In'}</button>
      </p>
    </motion.div>
  );

  const renderPhoneView = () => (
    <motion.div key="phone" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
       {/* ... (Phone View code - unchanged) ... */}
        <h2 className="text-3xl font-bold text-center text-white mb-2">Enter Phone</h2>
        <p className="text-gray-400 text-center mb-6">We'll send a verification code to your phone.</p>
        <form onSubmit={handlePhoneSignIn} className="space-y-4">
            <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="tel" placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="09[0-9]{7,9}" title="Please enter a valid Myanmar phone number starting with 09." className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
            <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">{loading ? 'Sending...' : 'Send OTP'} <LogIn size={20} /></button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
            <button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Sign in with Email</button>
        </p>
    </motion.div>
  );

  const renderOtpView = () => (
    <motion.div key="otp" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      {/* ... (OTP View code - unchanged) ... */}
        <h2 className="text-3xl font-bold text-center text-white mb-2">Verify OTP</h2>
        <p className="text-gray-400 text-center mb-6">Enter the code sent to your phone.</p>
        <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} pattern="\d{6}" title="Please enter the 6-digit OTP." className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
            <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">{loading ? 'Verifying...' : 'Verify & Log In'} <LogIn size={20} /></button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
            <button onClick={() => { setView('phone'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Use a different phone number</button>
        </p>
    </motion.div>
  );

  const renderForgotPasswordView = () => (
    <motion.div key="forgot_password" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        {/* ... (Forgot Password View code - unchanged) ... */}
        <h2 className="text-3xl font-bold text-center text-white mb-2">Reset Password</h2>
        <p className="text-gray-400 text-center mb-6">Enter your email and we'll send you a link to reset your password.</p>
        <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
            <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">{loading ? 'Sending...' : 'Send Reset Link'} <Send size={20} /></button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
            <button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button>
        </p>
    </motion.div>
  );


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative w-full max-w-md bg-card-dark/80 border border-border-color rounded-2xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            
            <AnimatePresence mode="wait">
              {view === 'email' && renderEmailView()}
              {view === 'phone' && renderPhoneView()}
              {view === 'otp' && renderOtpView()}
              {view === 'forgot_password' && renderForgotPasswordView()}
            </AnimatePresence>
            
            {(error || message) && (
              <div className="mt-4">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-2 rounded-md">
                      <AlertCircle size={16} /><span>{error}</span>
                    </motion.div>
                  )}
                  {message && !error && ( // Only show message if there's no error
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 p-2 rounded-md">
                      <span>{message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}