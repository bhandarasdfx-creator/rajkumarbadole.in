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
  Layers
} from 'lucide-react';
import { getWordPressConfig, saveWordPressConfig, WordPressConfig } from '@/lib/wordpress-sync';

export default function SettingsPage() {
  const [config, setConfig] = useState<WordPressConfig>({
    siteUrl: 'https://rajkumarbadole.in',
    username: 'admin',
    appPassword: '',
    autoSync: false
  });
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConfig(getWordPressConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveWordPressConfig(config);
    setToast('सेटिंग्ज यशस्वीरीत्या सेव्ह झाल्या!');
    setTimeout(() => setToast(''), 3000);
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
          राजकुमार बडोले यांच्या वेबसाइटशी (rajkumarbadole.in) डेटा जोडणी आणि Supabase संरचना.
        </p>
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

      {/* WordPress Direct Sync Form */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <Globe className="w-5 h-5 text-amber-400" />
            <span>WordPress थेट सिंक (rajkumarbadole.in REST API)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            WordPress API
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          येथे WordPress लॉगिन तपशील भरल्यास, प्रत्येक बातमी किंवा विकासकाम एका क्लिकवर थेट rajkumarbadole.in वर प्रकाशित होईल.
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">WordPress वेबसाइट URL</label>
            <input
              type="url"
              required
              value={config.siteUrl}
              onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">WordPress Admin युझरनेम</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="admin"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Application Password (ॲप पासवर्ड)</label>
              <input
                type="password"
                value={config.appPassword || ''}
                onChange={(e) => setConfig({ ...config, appPassword: e.target.value })}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                WP Admin &gt; Users &gt; Profile &gt; Application Passwords मधून जनरेट करा.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>WordPress सेटिंग्स सेव्ह करा</span>
          </button>
        </form>
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
            { label: 'मास्टर डेटा फीड (सर्वसमावेशक)', path: '/api/feed' },
            { label: 'ताज्या बातम्या API', path: '/api/news' },
            { label: 'माझे काम (विकासकामे) API', path: '/api/works' },
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
    </div>
  );
}
