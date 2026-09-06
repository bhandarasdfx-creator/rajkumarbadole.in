'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, PlusCircle, CheckCircle, Edit, Trash2, Check, Globe } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { Initiative, UserProfile } from '@/lib/types';
import { pushInitiativeToWordPress } from '@/lib/wordpress-sync';

export default function InitiativesPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInit, setEditingInit] = useState<Initiative | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('01');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/assets/rajkumar-badole-portrait.png');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setInitiatives(localStore.getInitiatives());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingInit(null);
    setTitle('');
    setBadgeNumber(String(initiatives.length + 1).padStart(2, '0'));
    setDescription('');
    setImageUrl('/assets/rajkumar-badole-portrait.png');
    setIsModalOpen(true);
  };

  const openEditModal = (init: Initiative) => {
    setEditingInit(init);
    setTitle(init.title);
    setBadgeNumber(init.badge_number);
    setDescription(init.description);
    setImageUrl(init.image_url);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const item: Initiative = {
      id: editingInit ? editingInit.id : 'init-' + Date.now(),
      title,
      badge_number: badgeNumber,
      description,
      image_url: imageUrl,
      status: 'published',
      created_at: editingInit ? editingInit.created_at : new Date().toISOString()
    };

    localStore.saveInitiative(item);
    loadData();
    setIsModalOpen(false);
    setToast(editingInit ? 'उपक्रम अद्ययावत केला!' : 'नवीन विशेष उपक्रम यशस्वीरीत्या जोडला!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleSyncWordPress = async (init: Initiative) => {
    setSyncStatus(prev => ({ ...prev, [init.id]: 'सिंक करत आहे...' }));
    const result = await pushInitiativeToWordPress(init);
    setSyncStatus(prev => ({
      ...prev,
      [init.id]: result.success ? `✓ ${result.message}` : `✗ ${result.message}`
    }));
    setTimeout(() => {
      setSyncStatus(prev => {
        const copy = { ...prev };
        delete copy[init.id];
        return copy;
      });
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>विशेष उपक्रम (Initiatives)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            rajkumarbadole.in वरील &apos;विशेष उपक्रम&apos; (उदा. जनसंवाद, युवा संवाद) चे कार्ड्स व मजकूर.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>नवीन उपक्रम जोडा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {initiatives.map((init) => (
          <div
            key={init.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition group space-y-4 shadow-xl"
          >
            <div className="space-y-3">
              <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={init.image_url}
                  alt={init.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-slate-950 shadow-md">
                  {init.badge_number}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1">{init.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{init.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> सक्रिय
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSyncWordPress(init)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition"
                  title="WordPress वर सिंक करा"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>WP सिंक</span>
                </button>
                <button
                  onClick={() => openEditModal(init)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sync Feedback */}
            {syncStatus[init.id] && (
              <div className="p-2 rounded-xl text-[11px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300 animate-fade-in">
                {syncStatus[init.id]}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{editingInit ? 'उपक्रम संपादित करा' : 'नवीन उपक्रम जोडा'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">उपक्रमाचे नाव *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. जनसंवाद अभियान"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">अनुक्रमांक (01, 02...)</label>
                <input
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">फोटो URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">थोडक्यात माहिती *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="नागरिकांशी थेट संवाद आणि समस्या निवारण..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
                >
                  सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
