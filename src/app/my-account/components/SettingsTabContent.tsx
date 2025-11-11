'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { Loader, AlertTriangle, User as UserIcon, Edit3, Save, XCircle, AtSign, CheckCircle, Mail, KeyRound, Palette, Trash2 } from 'lucide-react';
import { SettingsTabContentProps, Receipt } from '../my-account.types';

const SettingsTabContent: React.FC<SettingsTabContentProps> = ({
  profile, userEmail, receipts, deletingReceipt, handleDeleteReceipt,
  isEditingBio, setIsEditingBio, editingBioText, setEditingBioText, handleSaveBio, savingBio,
  isEditingUsername, setIsEditingUsername, editingUsernameText, setEditingUsernameText, handleSaveUsername, savingUsername,
}) => {
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [accentColor, setAccentColor] = useState(profile?.preferences?.accentColor || '#39FF14');
  const [savingAccent, setSavingAccent] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setAccentColor(profile?.preferences?.accentColor || '#39FF14');
    if (profile?.preferences?.accentColor) {
      document.documentElement.style.setProperty('--accent-color', profile.preferences.accentColor || '#39FF14');
    } else {
      document.documentElement.style.setProperty('--accent-color', '#39FF14');
    }
  }, [profile?.preferences?.accentColor]);

  const handleChangeEmail = async () => {
    if (!newEmail || savingEmail) return;
    setSavingEmail(true);
    setLocalError(null);
    setEmailMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMessage('Confirmation email sent to your new address. Please verify to complete the change.');
      setNewEmail('');
      setIsChangingEmail(false);
    } catch (e: any) {
      console.error('Change email failed', e);
      setLocalError(`Failed to update email: ${e.message}`);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword || savingPassword) {
      setLocalError('Passwords do not match or are empty.');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    setLocalError(null);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage('Password updated successfully!');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      console.error('Change password failed', e);
      setLocalError(`Failed to update password: ${e.message}`);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveAccent = async () => {
    if (!profile?.id || savingAccent) return;
    setSavingAccent(true);
    setLocalError(null);
    try {
      const prefs = { ...(profile.preferences || {}), accentColor };
      const { error } = await supabase.from('profiles').update({ preferences: prefs }).eq('id', profile.id);
      if (error) throw error;
      if (accentColor) {
        document.documentElement.style.setProperty('--accent-color', accentColor);
      }
    } catch (e: any) {
      console.error('Save accent failed', e);
      setLocalError(`Failed to save accent color: ${e.message}`);
    } finally {
      setSavingAccent(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id || deletingAccount) return;
    if (!deleteConfirmText || deleteConfirmText !== (profile.naju_id || '')) {
      setLocalError('Username confirmation does not match.');
      return;
    }
    setDeletingAccount(true);
    setLocalError(null);
    try {
      const anonHandle = `${profile.naju_id}-deleted-${Date.now()}`;
      const { error } = await supabase.from('profiles').update({
        avatar_url: null,
        banner_url: null,
        bio: null,
        naju_id: anonHandle,
        preferences: { ...(profile.preferences || {}), accentColor: null },
      }).eq('id', profile.id);

      if (error) throw error;

      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e: any) {
      console.error('Delete account failed', e);
      setLocalError(`Failed to delete account: ${e.message}`);
    } finally {
      setDeletingAccount(false);
    }
  };

  const startEditingBio = () => { setIsEditingBio(true); setEditingBioText(profile?.bio || ''); };
  const cancelEditingBio = () => { setIsEditingBio(false); };
  const startEditingUsername = () => { setIsEditingUsername(true); setEditingUsernameText(profile?.naju_id || ''); };
  const cancelEditingUsername = () => { setIsEditingUsername(false); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-text-dark-primary">Account Settings</h2>

      <AnimatePresence>
        {localError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-red-400 bg-red-900/30 border border-red-500/50 p-3 rounded-md">
            <AlertTriangle size={16} /><span>{localError}</span>
            <button onClick={() => setLocalError(null)} className="ml-auto text-red-200 hover:text-white"><XCircle size={16}/></button>
          </motion.div>
        )}
        {emailMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-900/30 border border-green-500/50 p-3 rounded-md">
            <CheckCircle size={16} /><span>{emailMessage}</span>
            <button onClick={() => setEmailMessage(null)} className="ml-auto text-green-200 hover:text-white"><XCircle size={16}/></button>
          </motion.div>
        )}
        {passwordMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-900/30 border border-green-500/50 p-3 rounded-md">
            <CheckCircle size={16} /><span>{passwordMessage}</span>
            <button onClick={() => setPasswordMessage(null)} className="ml-auto text-green-200 hover:text-white"><XCircle size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="settings-edit-profile" className="bg-card-dark p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-text-dark-primary flex items-center gap-2"><Edit3 size={18}/> Edit Profile</h3>
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-dark-secondary mb-1">Username</label>
          {isEditingUsername ? (
            <div className="space-y-2">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={editingUsernameText} onChange={(e) => setEditingUsernameText(e.target.value)} placeholder="Enter new username" className="w-full max-w-xs p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" maxLength={20} />
              </div>
              <div className="flex gap-2">
                <button onClick={cancelEditingUsername} disabled={savingUsername} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold disabled:opacity-50 text-text-dark-primary"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                <button onClick={() => handleSaveUsername(editingUsernameText)} disabled={savingUsername || editingUsernameText.trim().length < 3 || editingUsernameText.trim() === profile?.naju_id} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-1"> {savingUsername ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingUsername ? 'Saving...' : 'Save'} </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-text-dark-primary font-mono">@{profile?.naju_id || 'N/A'}</p>
              <button onClick={startEditingUsername} disabled={savingBio} className="text-xs text-text-dark-secondary hover:text-white disabled:opacity-50"> <Edit3 size={12} className="inline mr-0.5"/> Change </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark-secondary mb-1">About Me / Bio</label>
          {isEditingBio ? (
            <div className="space-y-3">
              <textarea value={editingBioText} onChange={(e) => setEditingBioText(e.target.value)} placeholder="Tell us about yourself..." className="w-full p-2 rounded bg-gray-700 border border-border-color min-h-[100px] text-sm focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" rows={4} maxLength={500} />
              <div className="flex justify-end gap-2">
                <button onClick={cancelEditingBio} disabled={savingBio} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold disabled:opacity-50"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                <button onClick={() => handleSaveBio(editingBioText)} disabled={savingBio || savingUsername} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 disabled:cursor-wait flex items-center gap-1"> {savingBio ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingBio ? 'Saving...' : 'Save Bio'} </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <p className="text-text-dark-secondary text-sm whitespace-pre-wrap flex-grow">{profile?.bio || <span className="italic">No bio added yet.</span>}</p>
              <button onClick={startEditingBio} disabled={savingUsername} className="text-xs text-text-dark-secondary hover:text-white disabled:opacity-50 shrink-0"> <Edit3 size={12} className="inline mr-0.5"/> Edit </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card-dark p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-text-dark-primary flex items-center gap-2"><UserIcon size={18}/> Account Management</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark-secondary mb-1">Email Address</label>
            <p className="text-text-dark-primary">{userEmail || 'Loading...'}</p>
            {!isChangingEmail ? (
              <button onClick={() => { setIsChangingEmail(true); setLocalError(null); setEmailMessage(null); }} className="mt-1 text-xs text-accent-blue hover:underline">Change Email</button>
            ) : (
              <div className="mt-2 flex flex-col gap-2 max-w-md">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" className="w-full p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setIsChangingEmail(false); setNewEmail(''); setLocalError(null); setEmailMessage(null); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold">Cancel</button>
                  <button onClick={handleChangeEmail} disabled={savingEmail || !newEmail} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                    {savingEmail ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingEmail ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark-secondary mb-1">Password</label>
            {!isChangingPassword ? (
              <button onClick={() => { setIsChangingPassword(true); setLocalError(null); setPasswordMessage(null); }} className="mt-1 text-xs text-accent-blue hover:underline">Change Password</button>
            ) : (
              <div className="mt-2 flex flex-col gap-2 max-w-sm">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="w-full p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setIsChangingPassword(false); setNewPassword(''); setConfirmPassword(''); setLocalError(null); setPasswordMessage(null); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold">Cancel</button>
                  <button onClick={handleChangePassword} disabled={savingPassword || !newPassword || newPassword !== confirmPassword} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                    {savingPassword ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingPassword ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card-dark p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-text-dark-primary flex items-center gap-2"><Palette size={18}/> Site Preferences</h3>
        <div>
          <label className="block text-sm font-medium text-text-dark-secondary mb-1">Accent Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-8 w-12 rounded bg-transparent border-none cursor-pointer" />
            <span className="text-sm font-mono">{accentColor}</span>
            <button onClick={handleSaveAccent} disabled={savingAccent || accentColor === (profile?.preferences?.accentColor || '#39FF14')} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
              {savingAccent ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingAccent ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card-dark p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-text-dark-primary">My Receipt Submissions</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {receipts.length > 0 ? receipts.map((r: Receipt) => (
            <div key={r.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center gap-4">
              <div>
                <p className="text-sm text-text-dark-secondary">Submitted: {new Date(r.created_at).toLocaleString()}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${ r.status === 'approved' ? 'bg-green-500 text-green-950' : r.status === 'rejected' ? 'bg-red-500 text-red-950' : 'bg-yellow-500 text-yellow-950' }`}> {r.status.toUpperCase()} </span>
              </div>
              {(r.status === 'pending' || r.status === 'rejected') && (
                <button onClick={() => handleDeleteReceipt(r.id, r.receipt_url)} disabled={deletingReceipt} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-medium transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                  {deletingReceipt ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          )) : <p className="text-text-dark-secondary">No submission history.</p>}
        </div>
        <Link href="/subscribe" className="mt-4 inline-block text-accent-green hover:underline text-sm"> Submit another receipt &rarr; </Link>
      </div>

      <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-3 text-red-300 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h3>
        {!deleteConfirmOpen ? (
          <button onClick={() => { setDeleteConfirmOpen(true); setLocalError(null); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete Account</button>
        ) : (
          <div className="space-y-3">
            <p className="text-red-300 text-sm">This action will **soft delete** your account by anonymizing your data and will sign you out. This cannot be undone.</p>
            <p className="text-red-300 text-xs">Please type your username <strong className='font-mono'>@{profile?.naju_id || ''}</strong> to confirm.</p>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full max-w-xs p-2 pl-9 rounded bg-gray-700 border border-red-700 focus:outline-none focus:ring-1 focus:ring-red-400 text-text-dark-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); setLocalError(null); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deletingAccount || deleteConfirmText !== (profile?.naju_id || '')} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                {deletingAccount ? <Loader size={14} className="animate-spin"/> : <Trash2 size={14} />} {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default SettingsTabContent;
