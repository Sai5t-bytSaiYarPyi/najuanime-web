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
  // --- View State အသစ်များ ထပ်တိုး ---
  const [view, setView] = useState<'email' | 'forgot_request_otp' | 'reset_otp_verify' | 'new_password'>('email');
  const [isLoginView, setIsLoginView] = useState(true); // Default to login

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); // Password အသစ်အတွက် state
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false); // Password အသစ်အတွက် show/hide
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState('');

  // Helper States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetStates = (keepEmail = false) => {
    if (!keepEmail) setEmail('');
    setPassword('');
    setNewPassword('');
    setUsername('');
    setOtp('');
    setShowPassword(false);
    setShowNewPassword(false);
    setRememberMe(false);
    setAgreedToTerms(false);
    setError(null);
    setMessage(null);
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    if (isLoginView) { // Login
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
          // --- Login Error Handling (Keep Link based message for now) ---
           if (signInError.message === 'Email not confirmed') {
              setError('Your email is not confirmed yet. Please check your inbox for the confirmation link.');
              setMessage('You can request a new confirmation link if needed.'); // TODO: Add resend logic later if sticking with links for signup
          } else {
              setError(signInError.message);
          }
      } else { onClose(); }
    } else { // Signup
      if (!agreedToTerms) { setError('You must agree to the Terms of Service and Privacy Policy.'); setLoading(false); return; }
      if (username.trim().length < 3) { setError('Username must be at least 3 characters long.'); setLoading(false); return; }

      // --- Signup Logic (Keep Link based for now as discussed) ---
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { username }, emailRedirectTo: `${window.location.origin}/` }
      });
      if (signUpError) { setError(signUpError.message); }
      else if (data.user && data.user.identities?.length === 0) { setError("This email is already registered but not confirmed. Please check your inbox or try logging in."); }
      else if (data.user) { setMessage('Registration successful! Please check your email for the confirmation link.'); resetStates(true); }
      else { setError('An unexpected error occurred during signup.'); }
    }
    setLoading(false);
  };

  // --- START: Password Reset OTP တောင်းတဲ့ Function ---
  const handleRequestPasswordOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);

    try {
        const { data, error: funcError } = await supabase.functions.invoke('request-password-reset-otp', {
            body: { email },
        });

        if (funcError) throw funcError;

        setMessage(data.message || 'OTP request sent.'); // Function ကပြန်တဲ့ message ကို ပြ
        setView('reset_otp_verify'); // OTP ရိုက်ထည့်ရမယ့် view ကို ပြောင်း

    } catch (err: any) {
        console.error("Error invoking request-password-reset-otp:", err);
        setError(err.message || 'Failed to request OTP. Please try again.');
        // --- Function Log မတက်ခဲ့ရင် ဒီနေရာမှာ error ပြနိုင် ---
        if (err.message && err.message.includes('Function not found')) {
            setError('Password reset service is currently unavailable. Please try again later.');
        }
    } finally {
        setLoading(false);
    }
  };
  // --- END: Password Reset OTP တောင်းတဲ့ Function ---

   // --- START: Password Reset OTP Verify Function (Placeholder - Edge Function ဒုတိယတစ်ခု လိုအပ်) ---
   const handleVerifyResetOtpAndSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);

    // TODO: Implement Step 4: Edge Function (၂) - verify-password-reset-otp
    // ဒီ function က email, otp, newPassword ကို လက်ခံပြီး backend မှာ verify/update လုပ်ရမယ်
    console.log("Verify OTP and Set New Password - Needs Edge Function Implementation");
    alert("Verify OTP and Set New Password functionality is not yet implemented.");

    // --- Placeholder Logic ---
    // Simulate checking OTP and moving to new password screen
    // In real implementation, the Edge function call would happen here.
    // If OTP is conceptually 'verified' by the function, then proceed.
    // For now, just simulate success to show the next step UI
    // setView('new_password'); // <-- This will be called after successful Edge function response in the future


    // --- Temporarily jumping to new password screen for UI check ---
    if (otp === '123456') { // Simulate correct OTP for UI testing
         setView('new_password');
    } else {
         setError("Invalid OTP (using placeholder check '123456')");
    }


    setLoading(false);
  };
  // --- END: Password Reset OTP Verify Function (Placeholder) ---

   // --- START: Password အသစ် သတ်မှတ်တဲ့ Function (Placeholder - Edge Function ဒုတိယတစ်ခု လိုအပ်) ---
   const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       setLoading(true); setError(null); setMessage(null);

       // TODO: Implement Step 4: Edge Function (၂) - verify-password-reset-otp
       // This function will handle OTP verification AND password update
       console.log("Set New Password - Needs Edge Function Implementation");
       alert("Set New Password functionality is integrated with OTP verification and not yet implemented.");

       // --- Placeholder Logic ---
       // Simulate successful password update
       setMessage("Password updated successfully! You can now log in.");
       setTimeout(() => {
           setView('email'); // Login view ကို ပြန်သွား
           setIsLoginView(true);
           resetStates(true); // Email မှလွဲ၍ ရှင်းထုတ်
       }, 2000);


       setLoading(false);
   }
   // --- END: Password အသစ် သတ်မှတ်တဲ့ Function (Placeholder) ---


  const handleClose = () => {
    resetStates();
    setView('email');
    setIsLoginView(true);
    onClose();
  };

  // --- START: Password Reset အတွက် OTP တောင်းတဲ့ View အသစ် ---
  const renderForgotPasswordRequestOtpView = () => (
    <motion.div key="forgot_request_otp" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        <h2 className="text-3xl font-bold text-center text-white mb-2">Reset Password</h2>
        <p className="text-gray-400 text-center mb-6">Enter your email and we'll send you a 6-digit code to reset your password.</p>
        <form onSubmit={handleRequestPasswordOtp} className="space-y-4">
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
            <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">
                {loading ? 'Sending OTP...' : 'Send OTP Code'} <Send size={20} />
            </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
            <button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button>
        </p>
    </motion.div>
  );
  // --- END: Password Reset အတွက် OTP တောင်းတဲ့ View အသစ် ---

  // --- START: Password Reset OTP Verify View အသစ် ---
   const renderResetOtpVerifyView = () => (
    <motion.div key="reset_otp_verify" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-2">Verify Reset Code</h2>
      <p className="text-gray-400 text-center mb-6">Enter the 6-digit code sent to {email}.</p>
      {/* --- အခု ဒီ form က placeholder function ကို ခေါ်မယ် --- */}
      <form onSubmit={handleVerifyResetOtpAndSetPassword} className="space-y-4">
        <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)}
                required maxLength={6} pattern="\d{6}" title="Please enter the 6-digit OTP."
                className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple tracking-[0.3em] text-center"
            />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">
            {loading ? 'Verifying...' : 'Verify Code'} <LogIn size={20} />
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-4">
        <button onClick={() => { setView('forgot_request_otp'); resetStates(true); }} className="font-semibold text-accent-green hover:text-green-400">Resend Code</button> {/* Resend needs logic */}
        <span className="mx-2 text-gray-600">|</span>
        <button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button>
      </p>
    </motion.div>
  );
  // --- END: Password Reset OTP Verify View အသစ် ---

   // --- START: Password အသစ် သတ်မှတ်ရန် View ---
   const renderNewPasswordView = () => (
        <motion.div key="new_password" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
            <h2 className="text-3xl font-bold text-center text-white mb-2">Set New Password</h2>
            <p className="text-gray-400 text-center mb-6">Enter your new password below for {email}.</p>
            {/* --- အခု ဒီ form က placeholder function ကို ခေါ်မယ် --- */}
            <form onSubmit={handleSetNewPassword} className="space-y-4">
                 <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required minLength={6} // Supabase default is 6
                        className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                 </div>
                 {/* Optional: Confirm New Password field */}
                 <button type="submit" disabled={loading} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2">
                    {loading ? 'Saving...' : 'Set New Password'} <LogIn size={20} />
                 </button>
            </form>
             <p className="text-center text-sm text-gray-400 mt-4">
                 <button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button>
             </p>
        </motion.div>
    );
   // --- END: Password အသစ် သတ်မှတ်ရန် View ---


  const renderEmailView = () => (
    <motion.div key="email" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        {/* ... (Email View code - unchanged from previous step) ... */}
         <h2 className="text-3xl font-bold text-center text-white mb-2">{isLoginView ? 'Welcome Back!' : 'Join the Universe'}</h2>
         <p className="text-gray-400 text-center mb-6">{isLoginView ? 'Log in to continue your journey.' : 'Create an account to get started.'}</p>
         <form onSubmit={handleEmailAuth} className="space-y-4">
             {!isLoginView && (<div className="relative"><UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>)}
             <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /></div>
             <div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-800 border border-border-color rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-purple" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
             {isLoginView && (<div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="hidden" />{rememberMe ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />} Remember Me</label><button type="button" onClick={() => { setView('forgot_request_otp'); resetStates(true); }} className="text-sm text-gray-400 hover:text-accent-green">Forgot Password?</button></div>)} {/* Forgot Password button now goes to forgot_request_otp view */}
             {!isLoginView && (<div className="flex items-start gap-2"><label htmlFor="terms" className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer mt-1"><input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="hidden" />{agreedToTerms ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />}</label><label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">I agree to the{' '} <Link href="/terms" target="_blank" className="text-accent-green hover:underline">Terms of Service</Link> and{' '} <Link href="/privacy" target="_blank" className="text-accent-green hover:underline">Privacy Policy</Link>.</label></div>)}
             <button type="submit" disabled={loading || (!isLoginView && !agreedToTerms)} className="w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">{loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')} <LogIn size={20} /></button>
         </form>
         <p className="text-center text-sm text-gray-400 mt-6">{isLoginView ? "Don't have an account?" : "Already have an account?"}<button onClick={() => { setIsLoginView(!isLoginView); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400 ml-1">{isLoginView ? 'Sign Up' : 'Log In'}</button></p>
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