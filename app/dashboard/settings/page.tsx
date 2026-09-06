'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Database,
  Key,
  Save,
  Check,
  ExternalLink,
  Code,
  Copy,
  Layers,
  Download,
  RefreshCw,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { getWordPressConfig, saveWordPressConfig, testWordPressConnection, triggerWordPressSync, WordPressConfig } from '@/lib/wordpress-sync';
import { localStore } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [config, setConfig] = useState<WordPressConfig>({
    siteUrl: 'https://rajkumarbadole.in',
    username: 'admin',
    appPassword: '',
    autoSync: true
  });
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDetails, setSyncDetails] = useState<{ message: string; success: boolean; imported?: any } | null>(null);

  useEffect(() => {
    setConfig(getWordPressConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveWordPressConfig(config);
    setToast('सेटिंग्ज यशस्वीरीत्या सेव्ह झाल्या!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    setSyncDetails(null);
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
      setSyncDetails({
        success: res.success,
        message: res.message,
        imported: res.imported
      });
      if (res.success) {
        setToast('✓ rajkumarbadole.in सह डेटा सिंक झाला!');
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e: any) {
      setSyncDetails({
        success: false,
        message: `त्रुटी: ${e.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyApiUrl = (endpoint: string) => {
    const full = typeof window !== 'undefined' ? `${window.location.origin}${endpoint}` : endpoint;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>साइट व सिंक सेटिंग्स (Integration Settings)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          राजकुमार बडोले यांच्या अधिकृत वेबसाइटशी (rajkumarbadole.in) थेट डेटा जोडणी आणि सिंक्रोनायझेशन.
        </p>
      </div>

      {/* Primary Direct WordPress Synchronization Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>थेट वेबसाइट सिंक्रोनायझेशन (Live Vercel ➔ rajkumarbadole.in)</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>थेट सिंक सक्षम (Active)</span>
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          हे सिंक्रोनायझेशन थेट <strong>https://newsroom.rajkumarbadole.in/</strong> (किंवा <strong>https://rajkumarbadole-newsroom.vercel.app/</strong>) येथूनच चालते. आपल्याला WordPress ॲडमिन पॅनेल उघडण्याची कोणतीही आवश्यकता नाही. आपण खालील बटण दाबून किंवा हेडरमधील <strong>&quot;⚡ WordPress सिंक&quot;</strong> बटण दाबून संपूर्ण डेटा त्वरित पाठवू शकता.
        </p>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-slate-400">WordPress WebHook Endpoint:</span>
            <span className="font-mono text-emerald-400 select-all">https://rajkumarbadole.in/wp-json/rb-newsroom/v1/sync</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-900 pt-2">
            <span className="text-slate-400">Newsroom Public JSON Feed:</span>
            <span className="font-mono text-amber-400 select-all">https://newsroom.rajkumarbadole.in/api/feed</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleFullSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition shadow-xl ${
              isSyncing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
            <span>{isSyncing ? 'डेटा WordPress वर सिंक होत आहे...' : '⚡ आत्ताच संपूर्ण डेटा WordPress वर सिंक करा'}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setTestResult('वेबहूक कनेक्शन तपासत आहे...');
              const res = await testWordPressConnection();
              setTestResult(res.message);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>WordPress कनेक्शन तपासा</span>
          </button>

          <a
            href="https://rajkumarbadole.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
          >
            <span>वेबसाइट उघडा</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>

        {syncDetails && (
          <div className={`p-4 rounded-2xl text-xs font-semibold border space-y-2 animate-fade-in ${
            syncDetails.success
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncDetails.message}</span>
            </div>
            {syncDetails.imported && (
              <div className="text-[11px] text-slate-300 font-normal pl-6">
                सिंक केलेले आयटम्स: {Object.entries(syncDetails.imported).map(([k, v]) => `${k}: ${v}`).join(' | ')}
              </div>
            )}
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded-xl text-xs font-medium ${
            testResult.startsWith('✓')
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
          }`}>
            {testResult}
          </div>
        )}
      </div>

      {/* Supabase Cloud Database Info */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Supabase क्लाउड डेटाबेस (hkucqrhyxolwdewirtrl)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            ऑनलाइन कनेक्टेड
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          हा प्रोजेक्ट Supabase PostgreSQL डेटाबेसवर आधारित आहे. डेटाबेसमध्ये टेबल्स तयार करण्यासाठी खालील बटण वापरून Supabase डॅशबोर्ड उघडा आणि `supabase/schema.sql` रन करा.
        </p>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="text-slate-400">प्रोजेक्ट URL:</div>
          <div className="text-amber-400 select-all">https://hkucqrhyxolwdewirtrl.supabase.co</div>
        </div>

        <a
          href="https://supabase.com/dashboard/project/hkucqrhyxolwdewirtrl/sql"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
        >
          <span>Supabase SQL Editor उघडा</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
        </a>
      </div>

      {/* REST API Endpoints for rajkumarbadole.in */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-white font-bold text-base">
          <Code className="w-5 h-5 text-blue-400" />
          <span>rajkumarbadole.in साठी लाइव्ह REST API Endpoints</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          कोणतीही वेबसाइट किंवा मोबाईल ॲप खालील API वापरून सेकंदात अद्ययावत डेटा लोड करू शकते:
        </p>

        <div className="space-y-2 text-xs">
          {[
            { label: 'मास्टर डेटा फीड (सर्वसमावेशक - बातम्या, कामे, उपक्रम, कार्यक्रम, व्हिडिओ)', path: '/api/feed' },
            { label: 'ताज्या बातम्या API', path: '/api/news' },
            { label: 'माझे काम (विकासकामे) API', path: '/api/works' },
            { label: 'WordPress थेट सिंक Webhook Proxy', path: '/api/sync-to-wordpress' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-slate-200 block">{item.label}</span>
                <span className="text-amber-400 font-mono text-[11px]">{item.path}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyApiUrl(item.path)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="URL कॉपी करा"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={item.path}
                  target="_blank"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="नवीन टॅबमध्ये तपासा"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WordPress Plugin & Shortcodes */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>WordPress प्लगइन आणि शॉर्टकोड्स (rajkumarbadole-newsroom-sync.php)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            v1.2.0 Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          आपल्या वर्डप्रेस साइटवर (rajkumarbadole.in) थेट डेटा दाखवण्यासाठी तयार केलेले <code>rajkumarbadole-newsroom-sync.php</code> हे प्लगइन वापरू शकता.
        </p>

        <div>
          <a
            href="/rb-newsroom-sync.zip"
            download="rb-newsroom-sync.zip"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>नवीन WordPress प्लगइन ZIP डाऊनलोड करा (rb-newsroom-sync.zip)</span>
          </a>
        </div>

        <div className="space-y-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">१</span>
              <span>पेजवर डेटा दाखवण्यासाठी शॉर्टकोड्स (Shortcodes):</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
              {[
                { label: 'ताज्या घडामोडी', code: '[rb_latest_news count="4"]' },
                { label: 'विकासकामे (माझे काम)', code: '[rb_development_works]' },
                { label: 'विशेष उपक्रम', code: '[rb_initiatives]' },
                { label: 'कार्यक्रम व दौरे', code: '[rb_events]' },
                { label: 'व्हिडिओ व भाषणे', code: '[rb_videos]' }
              ].map((sc, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">{sc.label}</span>
                    <code className="text-amber-300 font-mono text-xs">{sc.code}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sc.code);
                      setToast(`${sc.code} शॉर्टकोड कॉपी केला!`);
                      setTimeout(() => setToast(''), 2500);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="कॉपी करा"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
