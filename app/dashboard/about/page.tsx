'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Check,
  Globe,
  Upload,
  RotateCcw,
  Sparkles,
  Save,
  ArrowRight,
  ExternalLink,
  Eye
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { AboutProfile, UserProfile } from '@/lib/types';
import { pushAboutToWordPress } from '@/lib/wordpress-sync';
import SectionGuard from '@/components/SectionGuard';

export default function AboutPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<AboutProfile>(localStore.getAboutProfile());
  const [toast, setToast] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [eyebrow, setEyebrow] = useState(profile.eyebrow);
  const [title, setTitle] = useState(profile.title);
  const [description, setDescription] = useState(profile.description);
  const [portraitUrl, setPortraitUrl] = useState(profile.portrait_url);
  const [facts, setFacts] = useState(profile.facts || []);
  const [buttonText, setButtonText] = useState(profile.button_text || 'संपर्क माहिती');
  const [buttonUrl, setButtonUrl] = useState(profile.button_url || '#contact');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    const data = localStore.getAboutProfile();
    setProfile(data);
    setEyebrow(data.eyebrow);
    setTitle(data.title);
    setDescription(data.description);
    setPortraitUrl(data.portrait_url);
    setFacts(data.facts || []);
    setButtonText(data.button_text || 'संपर्क माहिती');
    setButtonUrl(data.button_url || '#contact');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPortraitUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFactChange = (index: number, field: 'title' | 'subtitle', val: string) => {
    setFacts(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: val };
      }
      return copy;
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const updated: AboutProfile = {
      eyebrow,
      title,
      description,
      portrait_url: portraitUrl,
      facts,
      button_text: buttonText,
      button_url: buttonUrl,
      updated_at: new Date().toISOString()
    };

    localStore.saveAboutProfile(updated);
    setProfile(updated);
    setIsSaving(false);
    setToast('✓ परिचय व प्रवास माहिती यशस्वीरीत्या सेव्ह झाली!');
    setTimeout(() => setToast(''), 4000);

    // Auto-sync to WordPress in background
    setIsSyncing(true);
    setSyncStatus('WordPress (rajkumarbadole.in) वर थेट अद्ययावत करत आहे...');
    const res = await pushAboutToWordPress(updated);
    setIsSyncing(false);
    setSyncStatus(res.success ? '✓ rajkumarbadole.in वर थेट सिंक झाले!' : `✗ ${res.message}`);
    setTimeout(() => setSyncStatus(''), 6000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('WordPress सह सिंक सुरू आहे...');
    const current: AboutProfile = {
      eyebrow,
      title,
      description,
      portrait_url: portraitUrl,
      facts,
      button_text: buttonText,
      button_url: buttonUrl,
      updated_at: new Date().toISOString()
    };
    localStore.saveAboutProfile(current);
    const res = await pushAboutToWordPress(current);
    setIsSyncing(false);
    setSyncStatus(res.success ? '✓ rajkumarbadole.in वर थेट सिंक झाले!' : `✗ ${res.message}`);
    setTimeout(() => setSyncStatus(''), 6000);
  };

  const handleReset = () => {
    if (confirm('सर्व मजकूर आणि ४ बॉक्सेस मूळ डीफॉल्ट स्थितीमध्ये आणायचे आहेत का?')) {
      const reset = localStore.resetAboutProfile();
      setProfile(reset);
      setEyebrow(reset.eyebrow);
      setTitle(reset.title);
      setDescription(reset.description);
      setPortraitUrl(reset.portrait_url);
      setFacts(reset.facts);
      setButtonText(reset.button_text);
      setButtonUrl(reset.button_url);
      setToast('मूळ माहिती पूर्ववत केली.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <SectionGuard section="about" sectionTitle="परिचय व माझा प्रवास">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Feedback */}
        {toast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fade-in">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-amber-400" />
              <span>परिचय व माझा प्रवास (About Section Editor)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              मुख्य वेबसाईटवरील (<span className="text-amber-300">rajkumarbadole.in/#about</span>) &quot;माझा प्रवास&quot; विभाग, फोटो, शीर्षक, परिच्छेद आणि ४ प्रमुख कार्य बॉक्सेस येथून थेट बदला.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="मूळ स्थितीत परत आणा"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>डीफॉल्ट रिसेट</span>
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition shadow-sm"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{isSyncing ? 'सिंक होत आहे...' : 'WordPress वर थेट सिंक करा'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'सेव्ह करत आहे...' : 'बदल सेव्ह करा'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="p-3 rounded-2xl text-xs font-semibold bg-blue-500/10 border border-blue-500/25 text-blue-300 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{syncStatus}</span>
            </div>
            <a
              href="https://rajkumarbadole.in/#about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] underline text-blue-400 hover:text-white flex items-center gap-1"
            >
              <span>वेबसाईटवर पहा</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Grid: Left Column Live Preview, Right Column Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: LIVE PREVIEW OF rajkumarbadole.in/#about (5 cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>लाईव्ह प्रिव्ह्यू (rajkumarbadole.in वर कसे दिसेल)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                #about preview
              </span>
            </div>

            {/* Browser / Website mockup card */}
            <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
              {/* Mockup Header bar */}
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 font-mono text-[10px] text-slate-500">rajkumarbadole.in/#about</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">थेट दृश्य</span>
              </div>

              {/* Mockup Body styled exactly like rajkumarbadole.in */}
              <div className="p-5 sm:p-6 bg-slate-900/60 space-y-5">
                {/* Profile Photo & Headings Layout */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Photo */}
                  <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/30 shadow-lg shrink-0">
                    <img
                      src={portraitUrl || '/assets/rajkumar-badole-portrait.png'}
                      alt="राजकुमार बडोले"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Eyebrow & Title & Description */}
                  <div className="space-y-1.5 text-center sm:text-left min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <span className="w-4 h-0.5 bg-emerald-400 inline-block rounded-full" />
                      <span>{eyebrow || 'माझा प्रवास'}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                      {title || 'सार्वजनिक जीवनातील प्रवास'}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {description || 'राजकुमार बडोले यांच्या सार्वजनिक जीवनातील प्रवास, उपक्रम आणि मतदारसंघाशी संबंधित कामांची माहिती येथे पाहता येईल.'}
                    </p>
                  </div>
                </div>

                {/* The 4 Facts / Highlights Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {facts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-0.5"
                    >
                      <h4 className="text-xs font-bold text-amber-300 truncate">
                        {fact.title || `कार्य #${idx + 1}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                        {fact.subtitle || 'माहिती येथे दिसेल...'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mockup Button */}
                <div className="pt-2 flex justify-center sm:justify-start">
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md">
                    <span>{buttonText || 'संपर्क माहिती'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              टीप: तुम्ही उजव्या बाजूला केलेले बदल तात्काळ या प्रिव्ह्यूमध्ये दिसतात. सेव्ह केल्यावर थेट मुख्य वेबसाईटवर अपडेट होतात.
            </p>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: EDIT FORM (7 cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* SECTION 1: Headings & Text */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>१. मुख्य शीर्षके व परिचय परिच्छेद</span>
                </h3>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    टॅगलाइन (Eyebrow / उप-शीर्षक) *
                  </label>
                  <input
                    type="text"
                    required
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    placeholder="उदा. माझा प्रवास"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    मुख्य मोठे शीर्षक (Main Heading) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="उदा. सार्वजनिक जीवनातील प्रवास"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-extrabold text-sm text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    परिचय मजकूर (Description Paragraph) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="राजकुमार बडोले यांच्या सार्वजनिक जीवनातील प्रवास, उपक्रम आणि मतदारसंघाशी संबंधित कामांची माहिती येथे पाहता येईल."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* SECTION 2: Profile Photo Upload */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>२. राजकुमार बडोले यांचा पोर्ट्रेट फोटो (Profile Photo)</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shrink-0">
                    <img
                      src={portraitUrl || '/assets/rajkumar-badole-portrait.png'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>मोबाईल/PC मधून नवीन फोटो अपलोड करा</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setPortraitUrl('/assets/rajkumar-badole-portrait.png')}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                      >
                        मूळ पोर्ट्रेट निवडा
                      </button>
                    </div>

                    <input
                      type="text"
                      value={portraitUrl}
                      onChange={(e) => setPortraitUrl(e.target.value)}
                      placeholder="/assets/... किंवा https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: The 4 Fact Cards */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>३. खालील ४ बॉक्सेस (Key Facts / Highlights)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">४ बॉक्सेस</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {facts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400">
                          बॉक्स #{idx + 1}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          शीर्षक (Bold Title)
                        </label>
                        <input
                          type="text"
                          required
                          value={fact.title}
                          onChange={(e) => handleFactChange(idx, 'title', e.target.value)}
                          placeholder="उदा. सार्वजनिक कार्य"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          उपशीर्षक / माहिती (Subtitle)
                        </label>
                        <input
                          type="text"
                          required
                          value={fact.subtitle}
                          onChange={(e) => handleFactChange(idx, 'subtitle', e.target.value)}
                          placeholder="उदा. सामाजिक आणि सार्वजनिक उपक्रम"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Contact Button */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  <span>४. संपर्क बटण (Action Button)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-1">
                      बटणावरील मजकूर (Button Text)
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="संपर्क माहिती"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-1">
                      बटणाची लिंक / URL (Button Link)
                    </label>
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="#contact किंवा https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Save / Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'बदल सेव्ह करत आहे...' : 'सर्व बदल सेव्ह करा व सिंक करा'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </SectionGuard>
  );
}
