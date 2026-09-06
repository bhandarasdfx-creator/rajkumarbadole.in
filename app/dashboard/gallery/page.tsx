'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, PlusCircle, Trash2, Check, Tag, Globe, Upload } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { GalleryItem, UserProfile } from '@/lib/types';
import { pushGalleryToWordPress } from '@/lib/wordpress-sync';
import SectionGuard from '@/components/SectionGuard';

export default function GalleryPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('/assets/rajkumar-badole-portrait.png');
  const [albumName, setAlbumName] = useState('जनसंवाद दौरा २०२६');
  const [caption, setCaption] = useState('');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setGallery(localStore.getGallery());
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
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;

    const newItem: GalleryItem = {
      id: 'gal-' + Date.now(),
      title,
      image_url: imageUrl,
      album_name: albumName,
      caption,
      created_at: new Date().toISOString()
    };

    localStore.saveGallery(newItem);
    loadData();
    setIsModalOpen(false);
    setTitle('');
    setCaption('');
    setToast('फोटो गॅलरीत यशस्वीरीत्या जोडला!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('हा फोटो काढून टाकायचा आहे का?')) {
      localStore.deleteGallery(id);
      loadData();
    }
  };

  const handleSyncWordPress = async (item: GalleryItem) => {
    setSyncStatus(prev => ({ ...prev, [item.id]: 'सिंक करत आहे...' }));
    const result = await pushGalleryToWordPress(item);
    setSyncStatus(prev => ({
      ...prev,
      [item.id]: result.success ? `✓ ${result.message}` : `✗ ${result.message}`
    }));
    setTimeout(() => {
      setSyncStatus(prev => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    }, 6000);
  };

  return (
    <SectionGuard section="gallery" sectionTitle="फोटो गॅलरी">
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
            <ImageIcon className="w-6 h-6 text-amber-400" />
            <span>फोटो गॅलरी (Media Gallery)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            राजकुमार बडोले यांच्या दौऱ्यांचे, भूमिपूजन आणि जनसंवादाचे फोटो.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>नवीन फोटो जोडा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition group"
          >
            <div className="relative aspect-video bg-slate-950 overflow-hidden">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 border border-slate-700">
                {item.album_name}
              </span>
            </div>

            <div className="p-4 space-y-1.5">
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              {item.caption && (
                <p className="text-xs text-slate-400">{item.caption}</p>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleSyncWordPress(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition"
                  title="WordPress वर सिंक करा"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>WP सिंक</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="काढून टाका"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sync Feedback */}
              {syncStatus[item.id] && (
                <div className="p-2 rounded-xl text-[11px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300 animate-fade-in">
                  {syncStatus[item.id]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              <span>नवीन फोटो जोडा</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">फोटोचे शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. ग्रामस्थांशी चर्चा करताना..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">अल्बम नाव (Album)</label>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="जनसंवाद दौरा २०२६"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>फोटो निवडा / अपलोड करा *</span>
                  <span className="text-[11px] text-slate-400 font-normal">PC/मोबाईलमधून फोटो अपलोड करा</span>
                </label>

                {/* Upload Button & Presets */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow-md shadow-amber-500/20">
                    <Upload className="w-3.5 h-3.5" />
                    <span>इमेज अपलोड करा (Upload Image)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setImageUrl('/assets/rajkumar-badole-banner.png')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    बॅनर निवडा
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageUrl('/assets/rajkumar-badole-standy.png')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    स्टँडी निवडा
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/assets/... किंवा https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />

                  {imageUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-2.5 py-1 rounded-lg bg-red-600/90 text-white text-xs font-bold hover:bg-red-500 transition"
                        >
                          काढून टाका
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">कॅप्शन / सविस्तर संदर्भ</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="कार्यक्रमाचे ठिकाण किंवा उपस्थित व्यक्ती..."
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
                  फोटो सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </SectionGuard>
  );
}
