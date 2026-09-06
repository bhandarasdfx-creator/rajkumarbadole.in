'use client';

import React, { useState, useEffect } from 'react';
import {
  HardHat,
  PlusCircle,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Check,
  MapPin,
  Coins
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { DevelopmentWork, UserProfile } from '@/lib/types';

export default function WorksPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [works, setWorks] = useState<DevelopmentWork[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('सर्व');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<DevelopmentWork | null>(null);
  const [toast, setToast] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('पायाभूत सुविधा');
  const [location, setLocation] = useState('');
  const [amount, setAmount] = useState('');
  const [completionDate, setCompletionDate] = useState('२०२६');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'completed' | 'in_progress' | 'draft'>('completed');

  const categories = [
    'सर्व',
    'पायाभूत सुविधा',
    'शिक्षण',
    'आरोग्य',
    'शेतकरी',
    'महिला',
    'युवक',
    'सामाजिक कार्य',
    'संस्कृती'
  ];

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setWorks(localStore.getWorks());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingWork(null);
    setTitle('');
    setCategory('पायाभूत सुविधा');
    setLocation('अर्जुनी-मोरगाव');
    setAmount('');
    setCompletionDate('२०२६');
    setDescription('');
    setStatus('completed');
    setIsModalOpen(true);
  };

  const openEditModal = (w: DevelopmentWork) => {
    setEditingWork(w);
    setTitle(w.title);
    setCategory(w.work_category);
    setLocation(w.village_location);
    setAmount(w.sanctioned_amount);
    setCompletionDate(w.completion_date);
    setDescription(w.description);
    setStatus(w.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const newWork: DevelopmentWork = {
      id: editingWork ? editingWork.id : 'work-' + Date.now(),
      title,
      work_category: category,
      village_location: location,
      sanctioned_amount: amount,
      completion_date: completionDate,
      description,
      status,
      author_id: currentUser?.id || 'admin',
      created_at: editingWork ? editingWork.created_at : new Date().toISOString()
    };

    localStore.saveWork(newWork);
    loadData();
    setIsModalOpen(false);
    setToast(editingWork ? 'विकासकाम अद्ययावत केले!' : 'नवीन विकासकाम यशस्वीरीत्या नोंदवले!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('हे विकासकाम काढून टाकायचे आहे का?')) {
      localStore.deleteWork(id);
      loadData();
    }
  };

  const filteredWorks = works.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase()) ||
                          w.village_location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'सर्व' || w.work_category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-amber-400" />
            <span>माझे काम (Development Works)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            rajkumarbadole.in वरील &apos;माझे काम&apos; (८ विभाग) मधील विकासकामांची माहिती फीड करा.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>नवीन विकासकाम नोंदवा</span>
        </button>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === c
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 sm:w-72">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="कामे किंवा गावाने शोधा..."
            className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Works Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorks.map((work) => (
          <div
            key={work.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition group space-y-4 shadow-xl"
          >
            <div className="space-y-3">
              {/* Category & Amount Pill */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                  {work.work_category}
                </span>
                {work.sanctioned_amount && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{work.sanctioned_amount}</span>
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white leading-snug">
                  {work.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{work.village_location}</span>
                  </span>
                  <span>•</span>
                  <span>वर्ष: {work.completion_date}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {work.description}
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                work.status === 'completed'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-amber-400 bg-amber-500/10'
              }`}>
                <CheckCircle className="w-3 h-3" />
                {work.status === 'completed' ? 'पूर्ण' : 'प्रगतीपथावर'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(work)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                  title="संपादित करा"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(work.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="काढून टाका"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                <span>{editingWork ? 'विकासकाम संपादित करा' : 'नवीन विकासकाम नोंदवा'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                मतदारसंघातील विकासकामाचा निधी, विभाग आणि ठिकाण भरा.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">कामाचे नाव / शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. मुख्य रस्त्याचे डांबरीकरण व रुंदीकरण..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">कामाचा विभाग (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="पायाभूत सुविधा">🏗️ पायाभूत सुविधा</option>
                    <option value="शिक्षण">🎓 शिक्षण</option>
                    <option value="आरोग्य">🏥 आरोग्य</option>
                    <option value="शेतकरी">🌾 शेतकरी व सिंचन</option>
                    <option value="महिला">👩 महिला सक्षमीकरण</option>
                    <option value="युवक">🧑‍🎓 युवक व कौशल्य</option>
                    <option value="सामाजिक कार्य">🤝 सामाजिक कार्य</option>
                    <option value="संस्कृती">🎭 संस्कृती व क्रीडा</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">गाव / परिसर (Location)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="उदा. सडक अर्जुनी"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">मंजूर निधी</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="उदा. ५.५ कोटी / ५० लाख"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">वर्ष / तारीख</label>
                  <input
                    type="text"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    placeholder="२०२६"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">कामाची स्थिती</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="completed">✅ पूर्ण (Completed)</option>
                    <option value="in_progress">⏳ सुरू (In Progress)</option>
                    <option value="draft">📝 मसुदा (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">सविस्तर माहिती व तपशील *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="या विकासकामामुळे नागरिकांना होणारा लाभ आणि वैशिष्ट्ये..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
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
                  {editingWork ? 'बदल सेव्ह करा' : 'विकासकाम नोंदवा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
