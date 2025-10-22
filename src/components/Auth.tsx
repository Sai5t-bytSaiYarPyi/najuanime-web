// src/components/Auth.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, KeyRound, LogIn, UserPlus, X, AlertCircle, Send, Eye, EyeOff, CheckSquare, Square, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Auth({ isOpen, onClose }: AuthProps) {
  const [view, setView] = useState<'email' | 'forgot_request_otp' | 'reset_otp_verify' | 'new_password'>('email');
  const [isLoginView, setIsLoginView] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetStates = (keepEmail = false) => {
    if (!keepEmail) setEmail('');
    setPassword(''); setNewPassword(''); setUsername(''); setOtp('');
    setShowPassword(false); setShowNewPassword(false); setRememberMe(false); setAgreedToTerms(false);
    setError(null); setMessage(null); setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault(); setLoading(true); setError(null); setMessage(null);
     if (isLoginView) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
             if (signInError.message === 'Email not confirmed') { setError('Your email is not confirmed yet. Please check your inbox for the confirmation link.'); setMessage('You can request a new confirmation link if needed.'); }
             else { setError(signInError.message); }
        } else { onClose(); }
     } else {
        if (!agreedToTerms) { setError('You must agree to the Terms of Service and Privacy Policy.'); setLoading(false); return; }
        if (username.trim().length < 3) { setError('Username must be at least 3 characters long.'); setLoading(false); return; }
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: `${window.location.origin}/` } });
        if (signUpError) { setError(signUpError.message); }
        else if (data.user && data.user.identities?.length === 0) { setError("This email is already registered but not confirmed. Please check your inbox or try logging in."); }
        else if (data.user) { setMessage('Registration successful! Please check your email for the confirmation link.'); resetStates(true); }
        else { setError('An unexpected error occurred during signup.'); }
     }
     setLoading(false);
  };

  const handleRequestPasswordOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
        const { data, error: funcError } = await supabase.functions.invoke('request-password-reset-otp', { body: { email } });
        if (funcError) throw funcError;
        setMessage(data.message || 'OTP request sent.');
        setView('reset_otp_verify');
    } catch (err: any) {
        console.error("Error invoking request-password-reset-otp:", err);
        setError(err.message || 'Failed to request OTP. Please try again.');
         if (err.message && err.message.includes('Function not found')) { setError('Password reset service is currently unavailable. Please try again later.'); }
    } finally { setLoading(false); }
  };

  const handleVerifyOtpAndSubmitNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError(null); setMessage(null);
    if (newPassword.length < 6) { setError('Password must be at least 6 characters long.'); setLoading(false); return; }
    try {
      const { data, error: funcError } = await supabase.functions.invoke('verify-password-reset-otp', { body: { email: email, otp: otp, newPassword: newPassword } });
      if (funcError) throw funcError;
      setMessage(data.message || 'Password updated successfully! You can now log in.');
      setTimeout(() => { setView('email'); setIsLoginView(true); resetStates(true); }, 2500);
    } catch (err: any) {
      console.error('Error invoking verify-password-reset-otp:', err);
      setError(err.error || err.message || 'Failed to verify OTP or update password.');
    } finally { setLoading(false); }
  };


  const handleClose = () => { resetStates(); setView('email'); setIsLoginView(true); onClose(); };

  // --- Render Functions ---

  const renderEmailView = () => (
    <motion.div key="email" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
       {/* ... (Email View code - unchanged) ... */}
         <h2 className="text-3xl font-bold text-center text-white mb-2">{isLoginView ? 'Welcome Back!' : 'Join the Universe'}</h2>
         <p className="text-gray-400 text-center mb-6">{isLoginView ? 'Log in to continue your journey.' : 'Create an account to get started.'}</p>
         <form onSubmit={handleEmailAuth} className="space-y-4">
             {!isLoginView && (<div className="relative"><UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>)}
             <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
             <div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
             {isLoginView && (<div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="hidden" />{rememberMe ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />} Remember Me</label><button type="button" onClick={() => { setView('forgot_request_otp'); resetStates(true); }} className="text-sm text-gray-400 hover:text-accent-green">Forgot Password?</button></div>)}
             {!isLoginView && (<div className="flex items-start gap-2"><label htmlFor="terms" className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer mt-1"><input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="hidden" />{agreedToTerms ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />}</label><label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">I agree to the{' '} <Link href="/terms" target="_blank" className="text-accent-green hover:underline">Terms of Service</Link> and{' '} <Link href="/privacy" target="_blank" className="text-accent-green hover:underline">Privacy Policy</Link>.</label></div>)}
             <button type="submit" disabled={loading || (!isLoginView && !agreedToTerms)} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">{loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')} <LogIn size={20} /></button>
         </form>
         <p className="text-center text-sm text-gray-400 mt-6">{isLoginView ? "Don't have an account?" : "Already have an account?"}<button onClick={() => { setIsLoginView(!isLoginView); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400 ml-1">{isLoginView ? 'Sign Up' : 'Log In'}</button></p>
    </motion.div>
  );

  const renderForgotPasswordRequestOtpView = () => (
    <motion.div key="forgot_request_otp" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        {/* ... (OTP Request View code - unchanged) ... */}
         <h2 className="text-3xl font-bold text-center text-white mb-2">Reset Password</h2>
        <p className="text-gray-400 text-center mb-6">Enter your email and we'll send you a 6-digit code to reset your password.</p>
        <form onSubmit={handleRequestPasswordOtp} className="space-y-4">
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
            <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">{loading ? 'Sending OTP...' : 'Send OTP Code'} <Send size={20} /></button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4"><button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button></p>
    </motion.div>
  );

  const renderResetOtpVerifyView = () => (
    <motion.div key="reset_otp_verify" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      {/* ... (OTP Verify View code - unchanged) ... */}
       <h2 className="text-3xl font-bold text-center text-white mb-2">Verify Reset Code</h2>
      <p className="text-gray-400 text-center mb-6">Enter the 6-digit code sent to {email}.</p>
      <form onSubmit={(e) => { e.preventDefault(); setView('new_password'); setError(null); setMessage(null); }} className="space-y-4">
        <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} pattern="\d{6}" title="Please enter the 6-digit OTP." className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple tracking-[0.3em] text-center" /></div>
        <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">Next: Set New Password <LogIn size={20} /></button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-4"><button onClick={() => { setView('forgot_request_otp'); resetStates(true); }} className="font-semibold text-accent-green hover:text-green-400">Resend Code</button><span className="mx-2 text-gray-600">|</span><button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button></p>
    </motion.div>
  );

  const renderNewPasswordView = () => (
    <motion.div key="new_password" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        {/* ... (New Password View code - unchanged) ... */}
         <h2 className="text-3xl font-bold text-center text-white mb-2">Set New Password</h2>
        <p className="text-gray-400 text-center mb-6">Enter your new password below for {email}.</p>
        <form onSubmit={handleVerifyOtpAndSubmitNewPassword} className="space-y-4">
             <div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type={showNewPassword ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
             <button type="submit" disabled={loading || newPassword.length < 6} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">{loading ? 'Saving...' : 'Verify OTP & Set Password'} <LogIn size={20} /></button>
        </form>
         <p className="text-center text-sm text-gray-400 mt-4"><button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button></p>
    </motion.div>
  );

  return (
     <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} className="relative w-full max-w-md bg-card-dark/80 border border-border-color rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            <AnimatePresence mode="wait">
              {view === 'email' && renderEmailView()}
              {/* --- Function နာမည် မှန်ကန်အောင် ပြင်ဆင် --- */}
              {view === 'forgot_request_otp' && renderForgotPasswordRequestOtpView()}
              {view === 'reset_otp_verify' && renderResetOtpVerifyView()}
              {view === 'new_password' && renderNewPasswordView()}
            </AnimatePresence>
            {(error || message) && (
              <div className="mt-4"><AnimatePresence>
                  {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-2 rounded-md"><AlertCircle size={16} /><span>{error}</span></motion.div>)}
                  {message && !error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 p-2 rounded-md"><span>{message}</span></motion.div>)}
              </AnimatePresence></div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}