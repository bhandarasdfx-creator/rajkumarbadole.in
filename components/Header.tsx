'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Database,
  Globe,
  Sparkles,
  ChevronDown,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { isSupabaseConfigured, localStore } from '@/lib/supabase/client';
import { triggerWordPressSync } from '@/lib/wordpress-sync';

interface HeaderProps {
  currentUser: UserProfile;
  title?: string;
  subtitle?: string;
}

export default function Header({ currentUser, title, subtitle }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const newVoiceCount = localStore.getVoiceMessages().filter(v => v.status === 'new').length;

  useEffect(() => {
    // Format date in Marathi
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    setCurrentDate(now.toLocaleDateString('mr-IN', options));
  }, []);

  const handleGlobalWpSync = async () => {
    setIsSyncing(true);
    try {
      const payload = {
        latest_news: localStore.getNews(),
        development_works: localStore.getWorks(),
        initiatives: localStore.getInitiatives(),
        events: localStore.getEvents(),
        videos: localStore.getVideos(),
        gallery: localStore.getGallery()
      };
      const res = await triggerWordPressSync(payload);
      if (res.success) {
        const now = new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });
        setLastSyncedTime(now);
        setSyncToast({
          message: '✓ rajkumarbadole.in वर डेटा थेट सिंक झाला!',
          type: 'success'
        });
      } else {
        setSyncToast({
          message: `सिंक त्रुटी: ${res.message}`,
          type: 'error'
        });
      }
    } catch (e: any) {
      setSyncToast({
        message: `त्रुटी: ${e.message}`,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 4500);
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30">
      {/* Toast Notification */}
      {syncToast && (
        <div className={`fixed top-18 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border animate-fade-in backdrop-blur-lg ${
          syncToast.type === 'success'
            ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
            : 'bg-rose-950/95 text-rose-300 border-rose-500/50 shadow-rose-950/50'
        }`}>
          {syncToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Globe className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Title / Breadcrumb */}
      <div>
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>{title || 'डॅशबोर्ड'}</span>
          {subtitle && (
            <>
              <span className="text-slate-600 font-normal">/</span>
              <span className="text-xs font-normal text-slate-400">{subtitle}</span>
            </>
          )}
        </h1>
      </div>

      {/* Center status: Marathi Date & Live Sync Indicator */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        <span className="text-slate-400 font-medium">📅 {currentDate}</span>
        <div className="h-4 w-px bg-slate-800" />
        
        {/* WordPress Sync Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>rajkumarbadole.in: {lastSyncedTime ? `सिंक (${lastSyncedTime})` : 'कनेक्टेड'}</span>
        </div>

        {/* Supabase Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          <Database className="w-3 h-3 text-amber-400" />
          <span>hkucqrhyxolwdewirtrl</span>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-2.5">
        {/* WordPress Direct Sync Button - Directly from rajkumarbadole-newsroom.vercel.app */}
        <button
          onClick={handleGlobalWpSync}
          disabled={isSyncing}
          title="सर्व डेटा थेट rajkumarbadole.in वर सिंक करा"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-md ${
            isSyncing
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 border border-emerald-500/50'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : 'text-emerald-200'}`} />
          <span>{isSyncing ? 'WordPress सिंक...' : '⚡ WordPress सिंक'}</span>
        </button>

        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">नवीन जोडा</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200"
              onClick={() => setDropdownOpen(false)}
            >
              {(currentUser.role === 'admin' || (currentUser.allowed_sections || ['news', 'works', 'events', 'gallery']).includes('news')) && (
                <Link
                  href="/dashboard/news"
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
                >
                  📰 नवीन बातमी / प्रेस नोट
                </Link>
              )}
              {(currentUser.role === 'admin' || (currentUser.allowed_sections || ['news', 'works', 'events', 'gallery']).includes('works')) && (
                <Link
                  href="/dashboard/works"
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
                >
                  🏗️ नवीन विकासकाम (माझे काम)
                </Link>
              )}
              {(currentUser.role === 'admin' || (currentUser.allowed_sections || []).includes('events')) && (
                <Link
                  href="/dashboard/events"
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
                >
                  📅 नवीन कार्यक्रम / दौरा
                </Link>
              )}
              {(currentUser.role === 'admin' || (currentUser.allowed_sections || []).includes('videos')) && (
                <Link
                  href="/dashboard/videos"
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
                >
                  🎥 नवीन YouTube व्हिडिओ
                </Link>
              )}
              {(currentUser.role === 'admin' || (currentUser.allowed_sections || []).includes('gallery')) && (
                <Link
                  href="/dashboard/gallery"
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
                >
                  🖼️ नवीन फोटो अल्बम
                </Link>
              )}
              {currentUser.role === 'admin' && (
                <Link
                  href="/dashboard/admin/users"
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 border-t border-slate-800 transition"
                >
                  👥 नवीन युझर नोंदणी
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <Link
          href="/dashboard/voice"
          title="नवीन संदेश / तक्रारी"
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
        >
          <Bell className="w-4 h-4" />
          {newVoiceCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950" />
          )}
        </Link>

        {/* Current User Session & Logout in Header */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">{currentUser.full_name}</span>
            <span className="text-[10px] text-amber-400 font-medium">@{currentUser.username || currentUser.role}</span>
          </div>
          <button
            onClick={() => {
              localStore.setCurrentUser(null);
              window.location.href = '/login';
            }}
            title="लॉगआउट करा"
            className="p-1.5 px-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">लॉगआउट</span>
          </button>
        </div>
      </div>
    </header>
  );
}
