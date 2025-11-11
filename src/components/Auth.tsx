// src/components/Auth.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, KeyRound, LogIn, UserPlus, X, AlertCircle, Send, Eye, EyeOff, CheckSquare, Square, Hash, AtSign, User } from 'lucide-react'; // User icon ထည့်ပါ
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Auth({ isOpen, onClose }: AuthProps) {
  const [view, setView] = useState<'email' | 'forgot_request_otp' | 'reset_otp_verify' | 'new_password' | 'email_otp_verify'>('email');
  const [isLoginView, setIsLoginView] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // --- START: "username" state ကို "name" လို့ ပိုရှင်းအောင် ပြောင်း (variable name) ---
  const [name, setName] = useState('');
  // --- END: "username" state ကို "name" လို့ ပိုရှင်းအောင် ပြောင်း ---
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetStates = (keepEmail = false) => {
      if (!keepEmail) setEmail(''); setPassword(''); setNewPassword(''); setName(''); setOtp(''); // name ကို reset လုပ်
      setShowPassword(false); setShowNewPassword(false); setRememberMe(false); setAgreedToTerms(false);
      setError(null); setMessage(null); setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError(null); setMessage(null);
    let trimmedName = ''; // name ကို catch block မှာ သုံးနိုင်အောင် အပြင်ထုတ်ထားပါ
    
    if (isLoginView) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
             if (signInError.message === 'Email not confirmed') { setError('Your email is not confirmed yet. Please verify using the OTP sent to your email.'); setMessage('You can request a new OTP if needed.'); }
             else { setError(signInError.message); }
        } else { onClose(); }
    } else {
      if (!agreedToTerms) { setError('You must agree to the Terms of Service and Privacy Policy.'); setLoading(false); return; }
      
      // --- START: Validation ကို "Name" အတွက် ပြင်ဆင်ခြင်း ---
      trimmedName = name.trim(); // trimmedName ကို ဒီမှာ value သတ်မှတ်
      if (trimmedName.length < 3) { setError('Name must be at least 3 characters long.'); setLoading(false); return; }
      if (trimmedName.length > 20) { setError('Name cannot be longer than 20 characters.'); setLoading(false); return; }
      
      // --- Regex Validation ကို ဖယ်ရှားလိုက်ပါပြီ ---
      // const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      // if (!usernameRegex.test(trimmedName)) { setError("Username can only contain letters, numbers, underscores (_), and hyphens (-)."); setLoading(false); return; }
      // --- END: Validation ကို "Name" အတွက် ပြင်ဆင်ခြင်း ---

      try {
          // --- START: signUp မှာ 'naju_id' ကို 'trimmedName' နဲ့ ပို့ပါ ---
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email, password, options: { data: { naju_id: trimmedName } } // 'naju_id' column ကို user ထည့်တဲ့ Name နဲ့ set လုပ်
          });
          // --- END: signUp မှာ 'naju_id' ကို 'trimmedName' နဲ့ ပို့ပါ ---
          
          if (signUpError) {
               if (signUpError.message === 'Database error saving new user') {
                   throw new Error(`Name "${trimmedName}" is already taken.`); // Error message ပြောင်း
               }
               if (signUpError.message.includes('duplicate key value violates unique constraint') && signUpError.message.includes('naju_id')) { 
                   throw new Error(`Name "${trimmedName}" is already taken.`); // Error message ပြောင်း
                }
               if (signUpError.message.includes('User already registered')) { throw new Error('This email address is already registered. Please log in.'); }
               throw signUpError;
          }
          if (signUpData.user) {
              const { data: otpData, error: otpFuncError } = await supabase.functions.invoke('send-signup-otp', { body: { email } }); //
              if (otpFuncError) {
                   if (otpFuncError.context?.status === 409) { setError("This email is already confirmed. Please log in."); setIsLoginView(true); }
                   else { throw otpFuncError; }
              } else { setMessage(otpData.message || 'Signup initiated. OTP sent to your email.'); setView('email_otp_verify'); }
          } else { throw new Error('User data not returned after signup.'); }
      
    } catch (err: any) { 
        console.error("Error during signup or OTP sending:", err);
        if (err.message === 'Database error saving new user' && trimmedName) {
            setError(`Name "${trimmedName}" is already taken or another database error occurred. Please try a different name.`); // Error message ပြောင်း
        } else {
            setError(err.message || 'An unexpected error occurred during signup.');
        }
    }
    }
    setLoading(false);
  };

    // (ကျန်တဲ့ function တွေ handleEmailOtpVerify, handleAutoLoginAfterVerification, handleRequestPasswordOtp, handleVerifyOtpAndSubmitNewPassword, handleClose မပြောင်းပါ)
    const handleEmailOtpVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true); setError(null); setMessage(null);
        try {
            const { data, error: funcError } = await supabase.functions.invoke('verify-signup-otp', { body: { email, otp }, }); //
            if (funcError) throw funcError;
            setMessage(data.message || 'Email verified successfully! You can now log in.');
            setTimeout(() => { handleAutoLoginAfterVerification(); }, 1500);
        } catch (err: any) { console.error("Error invoking verify-signup-otp:", err); setError(err.message || 'Failed to verify OTP.'); setLoading(false); }
    };

    const handleAutoLoginAfterVerification = async () => {
       setError(null); setMessage("Attempting to log you in...");
       const { error: signInError } = await supabase.auth.signInWithPassword({ email, password }); // password state ကို သုံးဖို့လိုပါမယ်
        if (signInError) { setError('Verification successful, but auto-login failed. Please log in manually.'); setView('email'); setIsLoginView(true); resetStates(true); setLoading(false); }
        else { setMessage('Login successful!'); setTimeout(onClose, 1000); }
    }

    const handleRequestPasswordOtp = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); setLoading(true); setError(null); setMessage(null);
      try {
          const { data, error: funcError } = await supabase.functions.invoke('request-password-reset-otp', { body: { email } }); //
          if (funcError) throw funcError;
          setMessage(data.message || 'OTP request sent.'); setView('reset_otp_verify');
      } catch (err: any) { console.error("Error invoking request-password-reset-otp:", err); setError(err.message || 'Failed to request OTP. Please try again.'); if (err.message && err.message.includes('Function not found')) { setError('Password reset service is currently unavailable.'); }
      } finally { setLoading(false); }
    };

    const handleVerifyOtpAndSubmitNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); setLoading(true); setError(null); setMessage(null);
      if (newPassword.length < 6) { setError('Password must be at least 6 characters long.'); setLoading(false); return; }
      try {
          const { data, error: funcError } = await supabase.functions.invoke('verify-password-reset-otp', { body: { email: email, otp: otp, newPassword: newPassword } }); //
          if (funcError) throw funcError;
          setMessage(data.message || 'Password updated successfully! You can now log in.'); setTimeout(() => { setView('email'); setIsLoginView(true); resetStates(true); }, 2500);
      } catch (err: any) { console.error('Error invoking verify-password-reset-otp:', err); setError(err.message || 'Failed to verify OTP or update password.');
      } finally { setLoading(false); }
    };

    const handleClose = () => { resetStates(); setView('email'); setIsLoginView(true); onClose(); };

    const inputClasses = "w-full bg-gray-700 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple";
    const otpInputClasses = "w-full bg-gray-700 border border-border-color rounded-lg py-2.5 pl-10 pr-4 text-text-dark-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple tracking-[0.3em] text-center";
    const buttonClasses = "w-full bg-accent-purple hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2";

    const renderEmailView = () => (
       <motion.div key="email" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
         <h2 className="text-3xl font-bold text-center text-text-dark-primary mb-2">{isLoginView ? 'Welcome Back!' : 'Join the Universe'}</h2>
         <p className="text-text-dark-secondary text-center mb-6">{isLoginView ? 'Log in to continue your journey.' : 'Create an account to get started.'}</p>
         <form onSubmit={handleEmailAuth} className="space-y-4">
             {!isLoginView && (
                 // --- START: "Username" ကို "Name" လို့ ပြောင်း၊ Validation တွေ ဖြေလျှော့ ---
                 <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                     <input 
                        type="text" 
                        placeholder="Name (3-20 characters)" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        minLength={3} 
                        maxLength={20} 
                        className={inputClasses} 
                     />
                 </div>
                 // --- END: "Username" ကို "Name" လို့ ပြောင်း၊ Validation တွေ ဖြေလျှော့ ---
             )}
             <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClasses} />
             </div>
             <div className="relative">
                <KeyRound className="absolute left-3 top-1/Vl-translate-y-1/2 text-gray-400" size={20} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClasses} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
             </div>
             {isLoginView && (<div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm text-text-dark-secondary cursor-pointer hover:text-text-dark-primary"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="hidden" />{rememberMe ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />} Remember Me</label><button type="button" onClick={() => { setView('forgot_request_otp'); resetStates(true); }} className="text-sm text-text-dark-secondary hover:text-accent-green">Forgot Password?</button></div>)}
             {!isLoginView && (<div className="flex items-start gap-2"><label htmlFor="terms" className="flex items-center gap-2 text-sm text-text-dark-secondary cursor-pointer mt-1 hover:text-text-dark-primary"><input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="hidden" />{agreedToTerms ? <CheckSquare size={16} className="text-accent-green"/> : <Square size={16} />}</label><label htmlFor="terms" className="text-xs text-text-dark-secondary cursor-pointer">I agree to the{' '} <Link href="/terms" target="_blank" className="text-accent-green hover:underline">Terms of Service</Link> and{' '} <Link href="/privacy" target="_blank" className="text-accent-green hover:underline">Privacy Policy</Link>.</label></div>)} {/* */}
             <button type="submit" disabled={loading || (!isLoginView && !agreedToTerms)} className={buttonClasses}>{loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')} <LogIn size={20} /></button>
         </form>
         <p className="text-center text-sm text-text-dark-secondary mt-6">{isLoginView ? "Don't have an account?" : "Already have an account?"}<button onClick={() => { setIsLoginView(!isLoginView); resetStates(true); }} className="font-semibold text-accent-green hover:text-green-400 ml-1">{isLoginView ? 'Sign Up' : 'Log In'}</button></p>
    </motion.div>
  );

    // (renderEmailOtpVerifyView, renderForgotPasswordRequestOtpView, renderResetOtpVerifyView, renderNewPasswordView တို့ မပြောင်းပါ)
    const renderEmailOtpVerifyView = () => (
        <motion.div key="email_otp_verify" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
          <h2 className="text-3xl font-bold text-center text-text-dark-primary mb-2">Verify Email OTP</h2> <p className="text-text-dark-secondary text-center mb-6">Enter the 6-digit code sent to {email}.</p>
          <form onSubmit={handleEmailOtpVerify} className="space-y-4">
            <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} pattern="\d{6}" title="Please enter the 6-digit OTP." className={otpInputClasses} /></div>
            <button type="submit" disabled={loading} className={buttonClasses}>{loading ? 'Verifying...' : 'Verify Email'} <LogIn size={20} /></button>
          </form>
          <p className="text-center text-sm text-text-dark-secondary mt-4"><button onClick={() => { setView('email'); resetStates(true); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login/Signup</button></p>
        </motion.div>
    );

    const renderForgotPasswordRequestOtpView = () => (
      <motion.div key="forgot_request_otp" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
         <h2 className="text-3xl font-bold text-center text-text-dark-primary mb-2">Reset Password</h2> <p className="text-text-dark-secondary text-center mb-6">Enter your email and we'll send you a 6-digit code to reset your password.</p>
        <form onSubmit={handleRequestPasswordOtp} className="space-y-4">
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClasses} /></div>
            <button type="submit" disabled={loading} className={buttonClasses}>{loading ? 'Sending OTP...' : 'Send OTP Code'} <Send size={20} /></button>
        </form>
        <p className="text-center text-sm text-text-dark-secondary mt-4"><button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button></p>
    </motion.div>
    );

    const renderResetOtpVerifyView = () => (
      <motion.div key="reset_otp_verify" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
       <h2 className="text-3xl font-bold text-center text-text-dark-primary mb-2">Verify Reset Code</h2> <p className="text-text-dark-secondary text-center mb-6">Enter the 6-digit code sent to {email}.</p>
      <form onSubmit={(e) => { e.preventDefault(); setView('new_password'); setError(null); setMessage(null); }} className="space-y-4">
        <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} pattern="\d{6}" title="Please enter the 6-digit OTP." className={otpInputClasses} /></div>
        <button type="submit" disabled={loading || otp.length !== 6} className={buttonClasses}>Next: Set New Password <LogIn size={20} /></button>
      </form>
      <p className="text-center text-sm text-text-dark-secondary mt-4"><button onClick={() => { setView('forgot_request_otp'); resetStates(true); }} className="font-semibold text-accent-green hover:text-green-400">Resend Code</button><span className="mx-2 text-gray-600">|</span><button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button></p>
    </motion.div>
    );

    const renderNewPasswordView = () => (
      <motion.div key="new_password" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
         <h2 className="text-3xl font-bold text-center text-text-dark-primary mb-2">Set New Password</h2> <p className="text-text-dark-secondary text-center mb-6">Enter your new password below for {email}.</p>
        <form onSubmit={handleVerifyOtpAndSubmitNewPassword} className="space-y-4">
             <div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type={showNewPassword ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={`${inputClasses} pr-10`} /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
             <button type="submit" disabled={loading || newPassword.length < 6} className={buttonClasses}>{loading ? 'Saving...' : 'Verify OTP & Set Password'} <LogIn size={20} /></button>
        </form>
         <p className="text-center text-sm text-text-dark-secondary mt-4"><button onClick={() => { setView('email'); resetStates(); }} className="font-semibold text-accent-green hover:text-green-400">Back to Login</button></p>
    </motion.div>
    );
    // --- (Render functions အဆုံး) ---


  return (
       <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} className="relative w-full max-w-md bg-card-dark border border-border-color rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClose} className="absolute top-4 right-4 text-text-dark-secondary hover:text-text-dark-primary transition-colors"><X size={24} /></button>
            <AnimatePresence mode="wait">
              {view === 'email' && renderEmailView()}
              {view === 'forgot_request_otp' && renderForgotPasswordRequestOtpView()}
              {view === 'reset_otp_verify' && renderResetOtpVerifyView()}
              {view === 'new_password' && renderNewPasswordView()}
              {view === 'email_otp_verify' && renderEmailOtpVerifyView()}
            </AnimatePresence>
            {(error || message) && (
              <div className="mt-4"><AnimatePresence>
                  {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-red-400 bg-red-900/30 border border-red-500/50 p-3 rounded-md"><AlertCircle size={16} /><span>{error}</span></motion.div>)}
                  {message && !error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-900/30 border border-green-500/50 p-3 rounded-md"><span>{message}</span></motion.div>)}
              </AnimatePresence></div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}