'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  HardHat,
  Sparkles,
  Calendar,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Users,
  History,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/lib/types';

interface SidebarProps {
  currentUser: UserProfile;
  onUserSwitch?: (role: UserRole) => void;
}

export default function Sidebar({ currentUser, onUserSwitch }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStore.setCurrentUser(null);
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'मुख्य डॅशबोर्ड', icon: LayoutDashboard },
    { href: '/dashboard/news', label: 'बातम्या व प्रेस नोट', icon: Newspaper, count: localStore.getNews().length },
    { href: '/dashboard/works', label: 'माझे काम (विकासकामे)', icon: HardHat, count: localStore.getWorks().length },
    { href: '/dashboard/initiatives', label: 'विशेष उपक्रम', icon: Sparkles, count: localStore.getInitiatives().length },
    { href: '/dashboard/events', label: 'कार्यक्रम व दौरे', icon: Calendar, count: localStore.getEvents().length },
    { href: '/dashboard/videos', label: 'व्हिडिओ व्यवस्थापन', icon: Video, count: localStore.getVideos().length },
    { href: '/dashboard/gallery', label: 'फोटो गॅलरी', icon: ImageIcon, count: localStore.getGallery().length },
    { href: '/dashboard/voice', label: 'जनतेचा आवाज', icon: MessageSquare, count: localStore.getVoiceMessages().filter(v => v.status === 'new').length, badgeColor: 'bg-amber-500' },
  ];

  const adminNavItems = [
    { href: '/dashboard/admin/users', label: 'युझर व्यवस्थापन', icon: Users, adminOnly: true },
    { href: '/dashboard/admin/logs', label: 'ऑडिट लॉग', icon: History, adminOnly: true },
    { href: '/dashboard/settings', label: 'साइट व सिंक सेटिंग्स', icon: Settings },
  ];

  const roleLabelMap: Record<UserRole, { label: string; badge: string }> = {
    admin: { label: 'मुख्य व्यवस्थापक (Admin)', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
    editor: { label: 'उप-संपादक (Editor)', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    reporter: { label: 'डेटा ऑपरेटर (Reporter)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  return (
    <aside className="w-72 shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10 bg-slate-800 flex items-center justify-center shrink-0">
              <img
                src="/assets/rajkumar-badole-portrait.png"
                alt="राजकुमार बडोले"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-100 text-lg tracking-tight truncate">राजकुमार बडोले</span>
              </div>
              <p className="text-xs font-medium text-amber-400/90 flex items-center gap-1">
                <span>न्यूज रूम व डेटा फीडर</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6">
          {/* Content Management Group */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              डेटा फीडिंग मॉड्यूल्स
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Administration Group */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>प्रशासन व नियंत्रण</span>
              {currentUser.role === 'admin' && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  Admin Panel
                </span>
              )}
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                if (item.adminOnly && currentUser.role !== 'admin') return null;
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer User Info & Role Switcher */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-3">
        {/* Quick Role Switcher for Pair Testing */}
        {onUserSwitch && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
              <span>रोल चाचणी (Role Test):</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['admin', 'editor', 'reporter'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onUserSwitch(r)}
                  className={`py-1 px-1.5 rounded-lg text-[11px] font-medium uppercase text-center transition ${
                    currentUser.role === r
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current User Card */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center justify-center shrink-0">
              {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border truncate ${roleLabelMap[currentUser.role]?.badge || ''}`}>
                  {roleLabelMap[currentUser.role]?.label.split(' ')[0]}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {currentUser.publish_permission === 'needs_approval' ? '🟡 मंजुरी' : '🟢 थेट'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="लॉगआउट"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* External Link to rajkumarbadole.in */}
        <a
          href="https://rajkumarbadole.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-900 rounded-xl transition border border-transparent hover:border-slate-800"
        >
          <span>rajkumarbadole.in उघडा</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}
