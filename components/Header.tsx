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
  ChevronDown
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { isSupabaseConfigured, localStore } from '@/lib/supabase/client';

interface HeaderProps {
  currentUser: UserProfile;
  title?: string;
  subtitle?: string;
}

export default function Header({ currentUser, title, subtitle }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <header className="h-16 px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30">
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
      <div className="hidden md:flex items-center gap-4 text-xs">
        <span className="text-slate-400 font-medium">📅 {currentDate}</span>
        <div className="h-4 w-px bg-slate-800" />
        
        {/* System Online Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>क्लाउड डेटा फीडर: ऑनलाइन</span>
        </div>

        {/* Supabase Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          <Database className="w-3 h-3 text-amber-400" />
          <span>प्रोजेक्ट: hkucqrhyxolwdewirtrl</span>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-3">
        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>नवीन जोडा</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200"
              onClick={() => setDropdownOpen(false)}
            >
              <Link
                href="/dashboard/news"
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
              >
                📰 नवीन बातमी / प्रेस नोट
              </Link>
              <Link
                href="/dashboard/works"
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
              >
                🏗️ नवीन विकासकाम (माझे काम)
              </Link>
              <Link
                href="/dashboard/events"
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
              >
                📅 नवीन कार्यक्रम / दौरा
              </Link>
              <Link
                href="/dashboard/videos"
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-amber-400 transition"
              >
                🎥 नवीन YouTube व्हिडिओ
              </Link>
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
      </div>
    </header>
  );
}
