// src/app/my-account/components/ProfileTabContent.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Loader, User as UserIcon, UploadCloud, Edit3, Activity } from 'lucide-react';
import ProfileStatsDisplay from './ProfileStatsDisplay';
import { Profile, ProfileStatsData, GenreStat, RatingStat } from '../my-account.types';

interface ProfileTabContentProps {
  profile: Profile | null;
  uploadingBanner: boolean;
  bannerInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: 'avatars' | 'banners',
    setLoadingState: (loading: boolean) => void
  ) => Promise<void>;
  setUploadingBanner: (b: boolean) => void;
  uploadingAvatar: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  setUploadingAvatar: (b: boolean) => void;
  isSubscribed: boolean;
  profileStats: ProfileStatsData;
  genreStats: GenreStat[] | null;
  ratingStats: RatingStat[] | null;
}

const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  profile,
  uploadingBanner,
  bannerInputRef,
  handleImageUpload,
  setUploadingBanner,
  uploadingAvatar,
  avatarInputRef,
  setUploadingAvatar,
  isSubscribed,
  profileStats,
  genreStats,
  ratingStats,
}) => {
  // --- START: display_name ကို အဓိက သုံး၊မရှိရင် naju_id ကို သုံး ---
  const displayName = profile?.display_name || profile?.naju_id || 'User';
  // --- END: display_name ကို အဓိက သုံး၊မရှိရင် naju_id ကို သုံး ---

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Banner */}
      <div className="h-40 md:h-56 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-lg relative shadow-lg group overflow-hidden">
        {profile?.banner_url ? (
          <Image
            src={profile.banner_url}
            alt="Profile Banner"
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-lg"
            priority
            sizes="(max-width: 768px) 100vw, 1184px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Default Banner Area
          </div>
        )}
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploadingBanner || uploadingAvatar}
          className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors text-xs opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
       >
          {uploadingBanner ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <UploadCloud size={14} />
          )}{' '}
          {uploadingBanner ? 'Uploading...' : 'Change Banner'}{' '}
        </button>
        <input
          type="file"
          ref={bannerInputRef}
          onChange={(e) => handleImageUpload(e, 'banners', setUploadingBanner)}
          accept="image/png, image/jpeg, image/webp, image/gif"
          style={{ display: 'none' }}
        />
      </div>

      {/* Avatar & Basic Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20 px-6">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background-dark bg-gray-600 flex items-center justify-center overflow-hidden shadow-xl shrink-0 group">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="User Avatar"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-full"
              sizes="(max-width: 768px) 128px, 160px"
            />
          ) : (
            <UserIcon size={64} className="text-gray-400" />
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar || uploadingBanner}
            className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingAvatar ? (
              <Loader size={20} className="animate-spin mb-1" />
            ) : (
              <UploadCloud size={20} className="mb-1" />
            )}{' '}
            {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}{' '}
          </button>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={(e) => handleImageUpload(e, 'avatars', setUploadingAvatar)}
            accept="image/png, image/jpeg, image/webp, image/gif"
            style={{ display: 'none' }}
          />
        </div>
        <div className="text-center sm:text-left pb-2 flex-grow">
          <div>
            {/* --- START: 'display_name' ကို အကြီးပြ၊ 'naju_id' ကို @handle အသေးပြ --- */}
            <h1 className="text-2xl md:text-3xl font-bold text-text-dark-primary">
              {displayName}
            </h1>
            <p className="text-text-dark-secondary font-mono text-sm">
              @{profile?.naju_id || 'N/A'}
            </p>
            {/* --- END: 'display_name' ကို အကြီးပြ၊ 'naju_id' ကို @handle အသေးပြ --- */}
          </div>
        </div>
        <div className="sm:ml-auto">
          {/* // Edit Profile Button (မပြောင်းပါ) */}
          <button
            onClick={() => {
              const settingsTab = document.querySelector(
                'button[aria-label="Settings Tab"]'
              ); 
              (settingsTab as HTMLElement)?.click(); 
              setTimeout(() => {
                document
                  .getElementById('settings-edit-profile')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Stats, Bio, Subscription, Recent Activity (မပြောင်းပါ) */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ProfileStatsDisplay
            stats={profileStats}
            genreStats={genreStats}
            ratingStats={ratingStats}
          />
          <div className="bg-card-dark p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-text-dark-primary mb-1">
              Subscription
            </h3>
            {isSubscribed ? (
              <div className="flex items-center gap-2">
                {' '}
                <span className="w-3 h-3 bg-green-500 rounded-full inline-block animate-pulse"></span>{' '}
                <span className="text-green-400 font-medium">ACTIVE</span>{' '}
                <span className="text-text-dark-secondary text-sm">
                  (Expires:{' '}
                  {profile?.subscription_expires_at
                    ? new Date(
                        profile.subscription_expires_at
                      ).toLocaleDateString()
                    : 'N/A'}
                  )
                </span>{' '}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {' '}
                <span
                  className={`w-3 h-3 ${
                    profile?.subscription_status === 'expired'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  } rounded-full inline-block`}
                ></span>{' '}
                <span
                  className={`${
                    profile?.subscription_status === 'expired'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  } font-medium`}
                >
                  {' '}
                  {profile?.subscription_status === 'expired'
                    ? 'EXPIRED'
                    : 'INACTIVE'}{' '}
                </span>{' '}
                <Link
                  href="/subscribe"
                  className="ml-auto text-accent-blue hover:underline text-sm font-semibold"
                >
                  Subscribe Now
                </Link>{' '}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card-dark p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-text-dark-primary">About Me</h3>
              <button
                onClick={() => {
                  const settingsTab = document.querySelector(
                    'button[aria-label="Settings Tab"]'
                  );
                  (settingsTab as HTMLElement)?.click();
                  setTimeout(() => {
                    document
                      .getElementById('settings-edit-profile')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-xs text-text-dark-secondary hover:text-white"
              >
                {' '}
                <Edit3 size={12} className="inline mr-1" /> Edit Bio{' '}
              </button>
            </div>
            {profile?.bio ? (
              <p className="text-text-dark-secondary text-sm whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-text-dark-secondary text-sm italic">
                No bio added yet.
              </p>
            )}
          </div>
          <div className="bg-card-dark p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-text-dark-primary mb-3 flex items-center gap-2">
              <Activity size={16} /> Recent Activity
            </h3>
            <p className="text-text-dark-secondary text-sm italic">
              (Coming Soon)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileTabContent;