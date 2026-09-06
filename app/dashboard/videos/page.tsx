'use client';

import React, { useState, useEffect } from 'react';
import { Video, PlusCircle, Play, Trash2, Edit, Check, ExternalLink } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { VideoItem, UserProfile } from '@/lib/types';

export default function VideosPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [category, setCategory] = useState('विधानसभा भाषण');
  const [description, setDescription] = useState('');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setVideos(localStore.getVideos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const extractYoutubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'dQw4w9WgXcQ';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeUrl) return;

    const ytId = extractYoutubeId(youtubeUrl);
    const newVideo: VideoItem = {
      id: 'vid-' + Date.now(),
      title,
      youtube_url: youtubeUrl,
      youtube_id: ytId,
      category,
      description,
      is_featured: false,
      created_at: new Date().toISOString()
    };

    localStore.saveVideo(newVideo);
    loadData();
    setIsModalOpen(false);
    setTitle('');
    setYoutubeUrl('');
    setDescription('');
    setToast('नवीन व्हिडिओ यशस्वीरीत्या जोडला!');
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
            <Video className="w-6 h-6 text-amber-400" />
            <span>व्हिडिओ व्यवस्थापन (Videos)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            राजकुमार बडोले यांची भाषणे, मुलाखती आणि जनसंवादाचे YouTube व्हिडिओ जोडा.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>नवीन व्हिडिओ जोडा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition group"
          >
            {/* Video Thumbnail Embed */}
            <div className="relative aspect-video bg-slate-950">
              <iframe
                src={`https://www.youtube.com/embed/${vid.youtube_id}`}
                title={vid.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {vid.category}
                </span>
                <a
                  href={vid.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <span>YouTube वर पहा</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">{vid.title}</h3>
              {vid.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{vid.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-amber-400" />
              <span>नवीन YouTube व्हिडिओ जोडा</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">व्हिडिओचे शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. विधानसभेत सिंचन प्रश्नावर आक्रमक मांडणी..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">YouTube URL / Link *</label>
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">प्रकार (Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="विधानसभा भाषण">विधानसभा भाषण</option>
                  <option value="जनसंवाद">जनसंवाद व दौरे</option>
                  <option value="मुलाखत">मुलाखत व वार्तालाप</option>
                  <option value="विकासकार्य वृत्त">विकासकार्य वृत्त</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">थोडक्यात माहिती</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="व्हिडिओमधील प्रमुख मुद्दे..."
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
                  व्हिडिओ सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
