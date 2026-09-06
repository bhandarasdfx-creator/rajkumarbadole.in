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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { NewsPost, UserProfile, PostStatus } from '@/lib/types';
import { pushNewsToWordPress, triggerWordPressSync, deleteItemFromWordPress } from '@/lib/wordpress-sync';
import SectionGuard from '@/components/SectionGuard';

export default function NewsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('सर्व');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('विकासकामे');
  const [featuredImage, setFeaturedImage] = useState('/assets/rajkumar-badole-portrait.png');
  const [status, setStatus] = useState<PostStatus>('published');

  const userNeedsApproval =
    currentUser?.publish_permission === 'needs_approval' ||
    (currentUser?.role === 'reporter' && currentUser?.publish_permission !== 'direct_publish');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setPosts(localStore.getNews());
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingPostsCount = posts.filter(p => p.status === 'pending').length;

  const categories = [
    'सर्व',
    'विकासकामे',
    'शेतकरी',
    'युवक',
    'शिक्षण',
    'आरोग्य',
    'जनसंवाद',
    ...(pendingPostsCount > 0 ? [`मंजुरी प्रलंबित (${pendingPostsCount})`] : [])
  ];

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCategory('विकासकामे');
    setFeaturedImage('/assets/rajkumar-badole-portrait.png');
    setStatus(userNeedsApproval ? 'pending' : 'published');
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
    setStatus(p.status);
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

  const handleSave = async (e: React.FormEvent, forcedStatus?: PostStatus) => {
    e.preventDefault();
    if (!title || !content) return;

    const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').slice(0, 50);
    const saveStatus: PostStatus = forcedStatus || (userNeedsApproval && status === 'published' ? 'pending' : status);

    const newPost: NewsPost = {
      id: editingPost ? editingPost.id : 'news-' + Date.now(),
      title,
      slug: postSlug,
      excerpt: excerpt || content.slice(0, 120) + '...',
      content,
      featured_image: featuredImage,
      category,
      status: saveStatus,
      author_id: currentUser?.id || 'admin',
      author_name: currentUser?.full_name || 'राजकुमार बडोले कार्यालय',
      views_count: editingPost ? editingPost.views_count : 1,
      published_at: saveStatus === 'published' ? (editingPost?.published_at || new Date().toISOString()) : '',
      created_at: editingPost ? editingPost.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStore.saveNews(newPost);
    loadData();
    setIsModalOpen(false);

    if (saveStatus === 'pending') {
      setToast('✓ बातमी मुख्य ॲडमिनच्या मंजुरीसाठी पाठवण्यात आली आहे!');
    } else if (saveStatus === 'published') {
      setToast(editingPost ? 'बातमी अद्ययावत केली व प्रकाशित झाली!' : 'नवीन बातमी तयार व थेट प्रकाशित करण्यात आली!');
      // Auto-trigger sync to WordPress
      pushNewsToWordPress(newPost);
    } else {
      setToast('बातमी मसुद्यात (Draft) सुरक्षित सेव्ह केली.');
    }
    setTimeout(() => setToast(''), 4000);
  };

  const handleApproveAndPublish = async (post: NewsPost) => {
    const updated: NewsPost = {
      ...post,
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.saveNews(updated);
    loadData();
    setToast(`✓ बातमी "${post.title}" मंजूर झाली! WordPress वर सिंक करत आहे...`);
    const wpRes = await pushNewsToWordPress(updated);
    if (wpRes.success) {
      setToast(`✓ बातमी मंजूर केली आणि rajkumarbadole.in वर थेट प्रकाशित झाली!`);
    } else {
      setToast(`✓ बातमी मंजूर केली (${wpRes.message})`);
    }
    setTimeout(() => setToast(''), 4500);
  };

  const handleRejectPost = (post: NewsPost) => {
    if (confirm(`"${post.title}" ही बातमी नामंजूर करून मसुद्यात (Draft) हलवायची का?`)) {
      const updated: NewsPost = {
        ...post,
        status: 'draft',
        updated_at: new Date().toISOString()
      };
      localStore.saveNews(updated);
      loadData();
      setToast('बातमी नामंजूर करून मसुद्यात हलवली.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleDelete = async (post: NewsPost) => {
    if (confirm(`'${post.title}' ही बातमी Newsroom आणि मुख्य वेबसाईट (WordPress) दोन्हीवरून कायमची काढून टाकायची आहे का?`)) {
      localStore.deleteNews(post.id);
      loadData();
      setToast('WordPress मधून बातमी काढत आहे...');
      const res = await deleteItemFromWordPress('news', post.id, post.title);
      setToast(res.message || 'बातमी काढण्यात आली.');
      setTimeout(() => setToast(''), 4000);
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

  const handleSyncAllNews = async () => {
    setIsBulkSyncing(true);
    try {
      const res = await triggerWordPressSync({ latest_news: localStore.getNews() });
      if (res.success) {
        setToast('✓ सर्व प्रकाशित बातम्या rajkumarbadole.in सह सिंक झाल्या!');
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
    if (selectedCat.startsWith('मंजुरी प्रलंबित')) {
      return matchesSearch && p.status === 'pending';
    }
    const matchesCat = selectedCat === 'सर्व' || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <SectionGuard section="news" sectionTitle="बातम्या व प्रेस नोट">
      <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fade-in backdrop-blur-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
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
            rajkumarbadole.in च्या मुख्य पृष्ठावरील &apos;ताज्या घडामोडी&apos; विभागासाठी बातम्या व्यवस्थापन.
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
            <span>{userNeedsApproval ? 'बातमी लिहा (मंजुरीसाठी)' : 'नवीन बातमी लिहा'}</span>
          </button>
        </div>
      </div>

      {/* Admin Approval Notice Banner (When pending posts exist) */}
      {pendingPostsCount > 0 && (currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
        <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-white">
                ⏳ {pendingPostsCount} बातमी/बातम्या ॲडमिन मंजुरीच्या प्रतीक्षेत आहेत!
              </span>
              <span className="text-xs text-amber-200/80">
                ऑपरेटर्सने सादर केलेल्या बातम्या तपासून मंजूर करा किंवा मसुद्यात ठेवा.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedCat(`मंजुरी प्रलंबित (${pendingPostsCount})`)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-md shadow-amber-500/20 shrink-0"
          >
            प्रलंबित बातम्या तपासा ({pendingPostsCount})
          </button>
        </div>
      )}

      {/* Category Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === c
                  ? c.startsWith('मंजुरी')
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-amber-500 text-slate-950 shadow-sm'
                  : c.startsWith('मंजुरी')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 sm:w-72">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
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
        {filteredPosts.map((post) => {
          const isPending = post.status === 'pending';
          const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'editor';

          return (
            <div
              key={post.id}
              className={`rounded-3xl bg-slate-900/90 border p-5 flex flex-col justify-between hover:border-slate-700 transition group space-y-4 shadow-xl ${
                isPending ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-slate-900' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Image & Badges */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={post.featured_image || '/assets/rajkumar-badole-portrait.png'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md border border-slate-700 text-amber-300">
                      {post.category}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md ${
                        post.status === 'published'
                          ? 'bg-emerald-500/90 text-white'
                          : post.status === 'pending'
                          ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {post.status === 'published'
                        ? '🟢 प्रकाशित'
                        : post.status === 'pending'
                        ? '⏳ मंजुरी प्रलंबित'
                        : '⚪ मसुदा'}
                    </span>
                  </div>
                </div>

                {/* Title & Excerpt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      📅 {post.published_at ? new Date(post.published_at).toLocaleDateString('mr-IN') : 'मंजुरीची प्रतीक्षा'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
                      लेखक: {post.author_name}
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
                {isPending && canApprove ? (
                  /* Admin/Editor Approval Action Controls */
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleApproveAndPublish(post)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>मंजूर करा (Approve)</span>
                    </button>
                    <button
                      onClick={() => handleRejectPost(post)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition border border-slate-700"
                      title="नामंजूर करा (Draft मध्ये हलवा)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition border border-slate-700"
                      title="तपासा व संपादित करा"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : isPending ? (
                  /* Reporter view of their pending post */
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>मुख्य ॲडमिनच्या मंजुरीच्या प्रतीक्षेत</span>
                    </span>
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                      title="संपादित करा"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Standard Published / Draft Controls */
                  <>
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
                        onClick={() => handleDelete(post)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="काढून टाका"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit News Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-amber-400" />
                  <span>{editingPost ? 'बातमी संपादन करा' : 'नवीन बातमी तयार करा'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  rajkumarbadole.in साठी प्रेस नोट व बातमीची माहिती भरा.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Publishing Rights Notice */}
            {userNeedsApproval ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">ॲडमिन मंजुरी आवश्यक (Send for Admin Approval)</span>
                  <span className="text-[11px] text-amber-200/80">
                    आपल्या खात्यानुसार हा मजकूर मुख्य ॲडमिनकडे मंजुरीसाठी पाठवला जाईल. ॲडमिनने मंजूर केल्यावरच तो वेबसाइटवर लाइव्ह होईल.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>आपल्याला <strong>थेट प्रसिद्धी (Direct Publish)</strong> चे अधिकार आहेत. बातमी थेट लाइव्ह होईल.</span>
              </div>
            )}

            <form onSubmit={(e) => handleSave(e)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">बातमीचे मुख्य शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. अर्जुनी-मोरगाव मतदारसंघातील विकासकामांसाठी निधी मंजूर..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">विभाग / वर्गवारी (Category) *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter(c => c !== 'सर्व' && !c.startsWith('मंजुरी')).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL Slug (इंग्रजी संक्षिप्त नाव)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="उदा. fund-sanction-arjuni-morgaon"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Photo Upload & Presets */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <label className="block text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>मुख्य फोटो (Featured Image)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">अपलोड करा किंवा निवडा</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow-md shadow-amber-500/20">
                    <Upload className="w-3.5 h-3.5" />
                    <span>📁 डिव्हाइसवरून फोटो निवडा (Upload)</span>
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

              {/* Action Buttons based on User Permission */}
              {userNeedsApproval ? (
                /* Needs Approval: Submit for Approval OR Save Draft */
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSave(e, 'draft')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition border border-slate-700"
                  >
                    💾 मसुदा (Draft) सेव्ह करा
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSave(e, 'pending')}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>📤 ॲडमिन मंजुरीसाठी पाठवा</span>
                  </button>
                </div>
              ) : (
                /* Direct Publish: Publish Directly OR Save Draft */
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSave(e, 'draft')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition border border-slate-700"
                  >
                    💾 मसुदा सेव्ह करा
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSave(e, 'published')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingPost ? 'बदल सेव्ह व प्रकाशित करा' : '⚡ थेट प्रकाशित करा (Live)'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      </div>
    </SectionGuard>
  );
}
