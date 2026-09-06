'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  HardHat,
  Sparkles,
  Calendar,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Users,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Share2,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Globe,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { UserProfile, NewsPost, DevelopmentWork, CitizenVoiceMessage, ActivityLog } from '@/lib/types';
import { triggerWordPressSync } from '@/lib/wordpress-sync';

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [newsList, setNewsList] = useState<NewsPost[]>([]);
  const [worksList, setWorksList] = useState<DevelopmentWork[]>([]);
  const [voiceList, setVoiceList] = useState<CitizenVoiceMessage[]>([]);
  const [logsList, setLogsList] = useState<ActivityLog[]>([]);
  const [isSyncingWp, setIsSyncingWp] = useState(false);
  const [wpSyncResult, setWpSyncResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);

  useEffect(() => {
    setUser(localStore.getCurrentUser());
    setNewsList(localStore.getNews());
    setWorksList(localStore.getWorks());
    setVoiceList(localStore.getVoiceMessages());
    setLogsList(localStore.getLogs());
  }, []);

  const handleTriggerFullSync = async () => {
    setIsSyncingWp(true);
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
      setWpSyncResult({
        success: res.success,
        message: res.message,
        timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (e: any) {
      setWpSyncResult({
        success: false,
        message: e.message
      });
    } finally {
      setIsSyncingWp(false);
    }
  };

  const stats = [
    {
      title: 'एकूण बातम्या व अपडेट्स',
      value: newsList.length,
      icon: Newspaper,
      href: '/dashboard/news',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
      badge: `${newsList.filter(n => n.status === 'published').length} प्रकाशित`
    },
    {
      title: 'माझे काम (विकासकामे)',
      value: worksList.length,
      icon: HardHat,
      href: '/dashboard/works',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
      badge: '८ विविध विभाग'
    },
    {
      title: 'आगामी कार्यक्रम व दौरे',
      value: localStore.getEvents().length,
      icon: Calendar,
      href: '/dashboard/events',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
      badge: 'कॅलेंडर सिंक'
    },
    {
      title: 'जनतेचा आवाज (संदेश)',
      value: voiceList.length,
      icon: MessageSquare,
      href: '/dashboard/voice',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
      badge: `${voiceList.filter(v => v.status === 'new').length} नवीन`
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>राजकुमार बडोले अधिकृत न्यूज रूम</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              नमस्कार, {user?.full_name || 'वापरकर्ता'}!
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              अर्जुनी-मोरगाव विधानसभा मतदारसंघातील विकासकामे, ताज्या घडामोडी, जनतेचे प्रश्न आणि डिजिटल प्रसिद्धी एकाच ठिकाणाहून व्यवस्थापित करा.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/dashboard/news"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नवीन बातमी लिहा</span>
            </Link>
            <Link
              href="/dashboard/works"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
            >
              <HardHat className="w-4 h-4 text-amber-400" />
              <span>विकासकाम नोंदवा</span>
            </Link>
          </div>
        </div>

        {/* Decorative corner emblem */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 pointer-events-none hidden md:block">
          <img
            src="/assets/rajkumar-badole-portrait.png"
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>

      {/* WordPress Live Direct Sync Action Banner */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>थेट वेबसाइट सिंक्रोनायझेशन</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">rajkumarbadole.in</span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <span>newsroom.rajkumarbadole.in वरून थेट WordPress अपडेट करा</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              येथून तयार केलेल्या सर्व ताज्या बातम्या, विकासकामे, उपक्रम आणि व्हिडिओ थेट मुख्य वेबसाइटवर (rajkumarbadole.in) एका क्लिकवर सिंक होतात. वेगळ्या वर्डप्रेस ॲडमिनमध्ये जाण्याची आवश्यकता नाही.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleTriggerFullSync}
              disabled={isSyncingWp}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition shadow-xl ${
                isSyncingWp
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingWp ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isSyncingWp ? 'WordPress वर सिंक होत आहे...' : '⚡ संपूर्ण डेटा WordPress वर सिंक करा'}</span>
            </button>

            <a
              href="https://rajkumarbadole.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              <span>rajkumarbadole.in उघडा</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>
          </div>
        </div>

        {wpSyncResult && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border animate-fade-in ${
            wpSyncResult.success
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            {wpSyncResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{wpSyncResult.message}</span>
            {wpSyncResult.timestamp && (
              <span className="text-[11px] text-slate-400 ml-auto font-normal">
                (शेवटचा सिंक: {wpSyncResult.timestamp})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick About / Profile Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white truncate">परिचय व माझा प्रवास (About Section Editor)</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">नवीन</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              मुख्य वेबसाईटवरील (<span className="text-amber-300 font-mono">rajkumarbadole.in/#about</span>) फोटो, शीर्षक, परिच्छेद आणि ४ कार्य बॉक्सेस थेट बदला.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/about"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <span>परिचय संपादित करा</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              href={stat.href}
              className={`p-5 rounded-2xl bg-gradient-to-br ${stat.color} border transition duration-200 hover:-translate-y-1 hover:shadow-xl block group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 group-hover:scale-110 transition">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-950/40 text-slate-300 border border-slate-800">
                  {stat.badge}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
              <div className="text-xs font-semibold text-slate-300">{stat.title}</div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Recent News Feed + Activity Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Published News & Works */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest News Feed */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-amber-400" />
                  <span>ताज्या बातम्या व प्रेस नोट</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">rajkumarbadole.in वर थेट प्रसिद्ध होणारा डेटा</p>
              </div>
              <Link
                href="/dashboard/news"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>सर्व पहा ({newsList.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {newsList.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(item.published_at).toLocaleDateString('mr-IN')}
                      </span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> प्रकाशित
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 hover:text-amber-300 transition truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                  {item.featured_image && (
                    <img
                      src={item.featured_image}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Development Works Highlight */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <span>नुकतीच नोंदवलेली विकासकामे</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">मतदारसंघातील विकासकामांची अधिकृत नोंद</p>
              </div>
              <Link
                href="/dashboard/works"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>सर्व कामे ({worksList.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {worksList.slice(0, 4).map((work) => (
                <div
                  key={work.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px]">
                      {work.work_category}
                    </span>
                    <span className="font-bold text-emerald-400 text-[11px]">
                      {work.sanctioned_amount}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{work.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{work.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: User Activity Stream + System Status */}
        <div className="space-y-6">
          {/* Activity Audit Log Widget */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>टीम ॲक्टिव्हिटी लॉग</span>
              </h3>
              {user?.role === 'admin' && (
                <Link
                  href="/dashboard/admin/logs"
                  className="text-[11px] font-semibold text-slate-400 hover:text-white"
                >
                  सर्व पाहा
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {logsList.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-amber-400 truncate max-w-[140px]">
                      {log.user_name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-200 font-medium">
                    <span className="text-slate-400 font-normal">कृती: </span>
                    {log.action}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {log.entity_type}: {log.entity_title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Feed Integration Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Share2 className="w-4 h-4" />
              <span>rajkumarbadole.in थेट सिंक</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              या टूलमधील सर्व डेटा थेट लाइव्ह REST API द्वारे उपलब्ध आहे. WordPress थीम आपोआप ताज्या बातम्या व विकासकामे फेच करू शकते.
            </p>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <a
                href="/api/feed"
                target="_blank"
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-center text-slate-200 transition flex items-center justify-center gap-1.5"
              >
                <span>लाइव्ह JSON API Feed तपासा</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>
              <Link
                href="/dashboard/settings"
                className="text-center text-[11px] font-semibold text-slate-400 hover:text-amber-400 py-1"
              >
                WordPress सिंक सेटिंग्स बदला →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
