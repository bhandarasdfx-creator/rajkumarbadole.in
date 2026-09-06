'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, MapPin, Clock, Users, Trash2, Edit, Check } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { EventItem, UserProfile } from '@/lib/types';

export default function EventsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('बैठक');
  const [date, setDate] = useState('2026-09-15');
  const [time, setTime] = useState('सकाळी ११:०० वा.');
  const [venue, setVenue] = useState('मध्यवर्ती संपर्क कार्यालय');
  const [chiefGuests, setChiefGuests] = useState('मा. आ. राजकुमार बडोले');
  const [description, setDescription] = useState('');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setEvents(localStore.getEvents());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setCategory('बैठक');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('सकाळी ११:०० वा.');
    setVenue('मध्यवर्ती संपर्क कार्यालय, अर्जुनी-मोरगाव');
    setChiefGuests('मा. आ. राजकुमार बडोले');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setCategory(evt.event_category);
    setDate(evt.event_date);
    setTime(evt.event_time || '');
    setVenue(evt.venue);
    setChiefGuests(evt.chief_guests || '');
    setDescription(evt.description);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !venue) return;

    const newEvt: EventItem = {
      id: editingEvent ? editingEvent.id : 'evt-' + Date.now(),
      title,
      event_category: category,
      event_date: date,
      event_time: time,
      venue,
      chief_guests: chiefGuests,
      description,
      status: 'upcoming',
      created_at: editingEvent ? editingEvent.created_at : new Date().toISOString()
    };

    localStore.saveEvent(newEvt);
    loadData();
    setIsModalOpen(false);
    setToast(editingEvent ? 'कार्यक्रम अद्ययावत केला!' : 'नवीन कार्यक्रम यशस्वीरीत्या जोडला!');
    setTimeout(() => setToast(''), 3000);
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
            <Calendar className="w-6 h-6 text-amber-400" />
            <span>कार्यक्रम व दौरे (Events)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            राजकुमार बडोले यांचे दौरे, सभा, उद्घाटन व बैठकांची माहिती भरा.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>नवीन कार्यक्रम जोडा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition group space-y-4 shadow-xl"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {evt.event_category}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  📅 {evt.event_date} {evt.event_time && `• ${evt.event_time}`}
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-snug">{evt.title}</h3>

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{evt.venue}</span>
                </div>
                {evt.chief_guests && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>प्रमुख उपस्थिती: {evt.chief_guests}</span>
                  </div>
                )}
              </div>

              {evt.description && (
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {evt.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-emerald-400 font-semibold">
                ● आगामी कार्यक्रम
              </span>
              <button
                onClick={() => openEditModal(evt)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>{editingEvent ? 'कार्यक्रम संपादित करा' : 'नवीन कार्यक्रम जोडा'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">कार्यक्रमाचे नाव / विषय *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. मतदारसंघ आढावा बैठक..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">प्रकार (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="बैठक">बैठक</option>
                    <option value="दौरा">दौरा</option>
                    <option value="सभा">सभा</option>
                    <option value="उद्घाटन">उद्घाटन</option>
                    <option value="कार्यकर्ता मेळावा">कार्यकर्ता मेळावा</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">तारीख *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">वेळ</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="सकाळी ११:०० वा."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ठिकाण / गाव *</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="गाव / कार्यालय / हॉल"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">प्रमुख उपस्थिती</label>
                <input
                  type="text"
                  value={chiefGuests}
                  onChange={(e) => setChiefGuests(e.target.value)}
                  placeholder="मा. आ. राजकुमार बडोले व मान्यवर"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">वर्णन / तपशील</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="कार्यक्रमाचा सविस्तर उद्देश..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
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
