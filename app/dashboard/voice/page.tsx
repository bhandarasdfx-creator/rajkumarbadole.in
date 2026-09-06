'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, MapPin, CheckCircle, Clock, Archive, Check } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { CitizenVoiceMessage, UserProfile } from '@/lib/types';
import SectionGuard from '@/components/SectionGuard';

export default function VoicePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<CitizenVoiceMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [toast, setToast] = useState('');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setMessages(localStore.getVoiceMessages());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = (id: string, status: CitizenVoiceMessage['status']) => {
    localStore.updateVoiceStatus(id, status);
    loadData();
    setToast('संदेशाची स्थिती अद्ययावत केली!');
    setTimeout(() => setToast(''), 3000);
  };

  const filtered = messages.filter(m => filter === 'all' || m.status === filter);

  const statusMap = {
    new: { label: 'नवीन', badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
    in_progress: { label: 'प्रक्रियेत', badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
    resolved: { label: 'निकाली', badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
    archived: { label: 'संग्रहित', badge: 'bg-slate-800 text-slate-400' }
  };

  return (
    <SectionGuard section="voice" sectionTitle="जनतेचा आवाज">
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
            <MessageSquare className="w-6 h-6 text-amber-400" />
            <span>जनतेचा आवाज (निवेदने व तक्रारी)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            rajkumarbadole.in च्या फॉर्मवरून नागरिकांनी पाठवलेले संदेश, समस्या व निवेदने.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === s
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'सर्व संदेश' : statusMap[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition shadow-xl"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMap[msg.status]?.badge}`}>
                  {statusMap[msg.status]?.label}
                </span>
                <h3 className="text-sm font-bold text-white">{msg.name}</h3>
                <span className="text-[11px] text-slate-500">
                  📅 {new Date(msg.created_at).toLocaleDateString('mr-IN')}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <a href={`tel:${msg.phone}`} className="flex items-center gap-1 hover:text-amber-400 transition font-mono">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{msg.phone}</span>
                </a>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{msg.place}</span>
                </span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                &ldquo;{msg.message}&rdquo;
              </p>

              {msg.admin_notes && (
                <div className="text-[11px] text-amber-400/90 font-medium">
                  कार्यालय टीप: {msg.admin_notes}
                </div>
              )}
            </div>

            <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
              <span className="text-[11px] text-slate-500">स्थिती बदला:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleUpdateStatus(msg.id, 'in_progress')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition"
                >
                  प्रक्रियेत
                </button>
                <button
                  onClick={() => handleUpdateStatus(msg.id, 'resolved')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition"
                >
                  निकाली
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </SectionGuard>
  );
}
