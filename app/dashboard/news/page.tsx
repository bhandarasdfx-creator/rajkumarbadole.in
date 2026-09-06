'use client';

import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  Check,
  Globe,
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { NewsPost, UserProfile } from '@/lib/types';
import { pushNewsToWordPress, triggerWordPressSync } from '@/lib/wordpress-sync';

export default function NewsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('सर्व');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('विकासकामे');
  const [featuredImage, setFeaturedImage] = useState('/assets/rajkumar-badole-portrait.png');
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const categories = ['सर्व', 'विकासकामे', 'शेतकरी', 'युवक', 'शिक्षण', 'आरोग्य', 'जनसंवाद'];

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setPosts(localStore.getNews());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCategory('विकासकामे');
    setFeaturedImage('/assets/rajkumar-badole-portrait.png');
    setStatus('published');
    setIsModalOpen(true);
  };

  const openEditModal = (p: NewsPost) => {
    setEditingPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt);
    setContent(p.content);
    setCategory(p.category);
    setFeaturedImage(p.featured_image || '/assets/rajkumar-badole-portrait.png');
    setStatus(p.status === 'published' ? 'published' : 'draft');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFeaturedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').slice(0, 50);

    const newPost: NewsPost = {
      id: editingPost ? editingPost.id : 'news-' + Date.now(),
      title,
      slug: postSlug,
      excerpt: excerpt || content.slice(0, 120) + '...',
      content,
      featured_image: featuredImage,
      category,
      status,
      author_id: currentUser?.id || 'admin',
      author_name: currentUser?.full_name || 'राजकुमार बडोले कार्यालय',
      views_count: editingPost ? editingPost.views_count : 1,
      published_at: editingPost ? editingPost.published_at : new Date().toISOString(),
      created_at: editingPost ? editingPost.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStore.saveNews(newPost);
    loadData();
    setIsModalOpen(false);
    setToast(editingPost ? 'बातमी यशस्वीरीत्या अद्ययावत केली!' : 'नवीन बातमी तयार व प्रसिद्ध करण्यात आली!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('ही बातमी काढून टाकायची आहे का?')) {
      localStore.deleteNews(id);
      loadData();
    }
  };

  const handleSyncWordPress = async (post: NewsPost) => {
    setSyncStatus(prev => ({ ...prev, [post.id]: 'सिंक करत आहे...' }));
    const result = await pushNewsToWordPress(post);
    setSyncStatus(prev => ({
      ...prev,
      [post.id]: result.success ? `✓ ${result.message}` : `✗ ${result.message}`
    }));
    setTimeout(() => {
      setSyncStatus(prev => {
        const copy = { ...prev };
        delete copy[post.id];
        return copy;
      });
    }, 6000);
  };

  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const handleSyncAllNews = async () => {
    setIsBulkSyncing(true);
    try {
      const res = await triggerWordPressSync({ latest_news: localStore.getNews() });
      if (res.success) {
        setToast('✓ सर्व बातम्या rajkumarbadole.in सह सिंक झाल्या!');
      } else {
        setToast(`त्रुटी: ${res.message}`);
      }
    } catch (e: any) {
      setToast(`त्रुटी: ${e.message}`);
    } finally {
      setIsBulkSyncing(false);
      setTimeout(() => setToast(''), 4000);
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                          p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'सर्व' || p.category === selectedCat;
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
            <Newspaper className="w-6 h-6 text-amber-400" />
            <span>बातम्या व प्रेस नोट (Newsroom)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            rajkumarbadole.in च्या मुख्य पृष्ठावरील &apos;ताज्या घडामोडी&apos; विभागासाठी बातम्या प्रसिद्ध करा.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSyncAllNews}
            disabled={isBulkSyncing}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
              isBulkSyncing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin text-amber-300' : ''}`} />
            <span>{isBulkSyncing ? 'सिंक होत आहे...' : '⚡ सर्व WP सिंक'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>नवीन बातमी लिहा</span>
          </button>
        </div>
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
            placeholder="बातम्या शोधा..."
            className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none w-full"
          />
        </div>
      </div>

      {/* News List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition group space-y-4 shadow-xl"
          >
            <div className="space-y-3">
              {/* Image & Badges */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={post.featured_image || '/assets/rajkumar-badole-portrait.png'}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md border border-slate-700 text-amber-300">
                    {post.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/80 backdrop-blur-md text-white">
                    {post.status === 'published' ? 'प्रकाशित' : 'मसुदा'}
                  </span>
                </div>
              </div>

              {/* Title & Excerpt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>📅 {new Date(post.published_at).toLocaleDateString('mr-IN')}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" /> {post.views_count} वाचले
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </div>

            {/* Sync Feedback */}
            {syncStatus[post.id] && (
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 leading-tight">
                {syncStatus[post.id]}
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => handleSyncWordPress(post)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-semibold border border-slate-700"
                title="थेट rajkumarbadole.in वर सिंक करा"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>WP सिंक</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(post)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                  title="संपादित करा"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
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

      {/* Compose/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-amber-400" />
                <span>{editingPost ? 'बातमी संपादित करा' : 'नवीन बातमी / प्रेस नोट लिहा'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                rajkumarbadole.in साठी बातमी मजकूर व छायाचित्र प्रविष्ट करा.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">बातमीचे शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. मतदारसंघातील विकासकामांसाठी २५ कोटींचा निधी मंजूर..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">विभाग निवडा (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="विकासकामे">🏗️ विकासकामे</option>
                    <option value="शेतकरी">🌾 शेतकरी व कृषी</option>
                    <option value="युवक">🧑‍🎓 युवक व कौशल्य</option>
                    <option value="शिक्षण">🎓 शिक्षण</option>
                    <option value="आरोग्य">🏥 आरोग्य</option>
                    <option value="जनसंवाद">🤝 जनसंवाद व दौरे</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">स्थिती (Status)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="published">✅ थेट प्रकाशित (Published)</option>
                    <option value="draft">📝 मसुदा (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>मुख्य छायाचित्र (Featured Image)</span>
                  <span className="text-[11px] text-slate-400 font-normal">PC/मोबाईलमधून फोटो अपलोड करा किंवा निवडा</span>
                </label>

                {/* Upload & Preset Options */}
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
                    onClick={() => setFeaturedImage('/assets/rajkumar-badole-banner.png')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      featuredImage === '/assets/rajkumar-badole-banner.png'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    बॅनर निवडा
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeaturedImage('/assets/rajkumar-badole-standy.png')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      featuredImage === '/assets/rajkumar-badole-standy.png'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    स्टँडी निवडा
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeaturedImage('/assets/rajkumar-badole-portrait.png')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      featuredImage === '/assets/rajkumar-badole-portrait.png'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    पोर्ट्रेट निवडा
                  </button>
                </div>

                {/* Input & Preview */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="किंवा थेट इमेज लिंक टाका (/assets/... किंवा https://...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />

                  {featuredImage && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                      <img
                        src={featuredImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-200">निवडलेले छायाचित्र</span>
                        <button
                          type="button"
                          onClick={() => setFeaturedImage('')}
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
                <label className="block text-slate-300 font-semibold mb-1">थोडक्यात सारांश (Excerpt)</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="बातमीचा २ ओळींचा मुख्य गोषवारा..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">सविस्तर बातमी मजकूर (Full Content) *</label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="सविस्तर बातमी येथे लिहा..."
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
                  {editingPost ? 'बदल सेव्ह करा' : 'बातमी प्रकाशित करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
