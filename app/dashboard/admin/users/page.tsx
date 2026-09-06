'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  KeyRound,
  Trash2,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  Search,
  Check,
  Clock,
  Send,
  Sparkles,
  HelpCircle,
  Edit2,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Layers,
  X
} from 'lucide-react';
import { localStore, ALL_APP_SECTIONS, DEFAULT_REPORTER_SECTIONS } from '@/lib/supabase/client';
import { UserProfile, UserRole, PublishPermission, AppSection } from '@/lib/types';

const AVAILABLE_SECTIONS: {
  id: AppSection;
  label: string;
  sublabel: string;
  icon: string;
}[] = [
  { id: 'news', label: 'बातम्या व प्रेस नोट', sublabel: 'Newsroom & Press', icon: '📰' },
  { id: 'works', label: 'माझे काम (विकासकामे)', sublabel: 'Development Works', icon: '🏗️' },
  { id: 'initiatives', label: 'विशेष उपक्रम', sublabel: 'Key Initiatives', icon: '✨' },
  { id: 'events', label: 'कार्यक्रम व दौरे', sublabel: 'Events & Tours', icon: '📅' },
  { id: 'videos', label: 'व्हिडिओ व्यवस्थापन', sublabel: 'YouTube Videos', icon: '🎥' },
  { id: 'gallery', label: 'फोटो गॅलरी', sublabel: 'Photo Albums', icon: '🖼️' },
  { id: 'voice', label: 'जनतेचा आवाज', sublabel: 'Citizen Voice', icon: '🗣️' },
];

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [successToast, setSuccessToast] = useState('');

  // Form State (used for both Add and Edit)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('reporter');
  const [publishPermission, setPublishPermission] = useState<PublishPermission>('needs_approval');
  const [selectedSections, setSelectedSections] = useState<AppSection[]>(DEFAULT_REPORTER_SECTIONS);
  const [password, setPassword] = useState('');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setUsers(localStore.getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('reporter');
    setPublishPermission('needs_approval');
    setSelectedSections(['news', 'works', 'events', 'gallery']);
    setPassword('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setName(user.full_name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setPublishPermission(user.publish_permission || (user.role === 'reporter' ? 'needs_approval' : 'direct_publish'));
    setSelectedSections(user.allowed_sections && user.allowed_sections.length > 0 ? user.allowed_sections : ALL_APP_SECTIONS);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
    if (!editingUser) {
      if (newRole === 'reporter') {
        setPublishPermission('needs_approval');
        setSelectedSections(['news', 'works', 'events', 'gallery']);
      } else {
        setPublishPermission('direct_publish');
        setSelectedSections(ALL_APP_SECTIONS);
      }
    }
  };

  const toggleSection = (secId: AppSection) => {
    setSelectedSections(prev =>
      prev.includes(secId) ? prev.filter(s => s !== secId) : [...prev, secId]
    );
  };

  const selectAllSections = () => {
    setSelectedSections(ALL_APP_SECTIONS);
  };

  const clearAllSections = () => {
    setSelectedSections([]);
  };

  const selectStandardReporterSections = () => {
    setSelectedSections(['news', 'works', 'events', 'gallery']);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (selectedSections.length === 0) {
      alert('कृपया युझरसाठी किमान एक सेक्शन निवडा!');
      return;
    }

    if (editingUser) {
      // Update existing user
      const updated: UserProfile = {
        ...editingUser,
        full_name: name,
        email,
        phone,
        role,
        publish_permission: publishPermission,
        allowed_sections: selectedSections
      };
      localStore.saveUser(updated);

      // If current logged-in user is editing themselves, update session
      if (currentUser?.id === updated.id) {
        localStore.setCurrentUser(updated);
        setCurrentUser(updated);
      }

      setSuccessToast(`युझर "${name}" चे अधिकार व सेक्शन्स यशस्वीरीत्या अपडेट करण्यात आले!`);
    } else {
      // Create new user
      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        full_name: name,
        email,
        phone,
        role,
        publish_permission: publishPermission,
        allowed_sections: selectedSections,
        is_active: true,
        created_at: new Date().toISOString()
      };
      localStore.saveUser(newUser);
      const permText = publishPermission === 'direct_publish' ? 'थेट प्रसिद्धी' : 'मंजुरी आवश्यक';
      setSuccessToast(`नवीन युझर "${name}" (${permText}, ${selectedSections.length} सेक्शन्स) यशस्वीरीत्या तयार झाला!`);
    }

    loadData();
    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleToggleStatus = (userId: string) => {
    localStore.toggleUserStatus(userId);
    loadData();
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const autoPerm: PublishPermission = newRole === 'reporter' ? 'needs_approval' : 'direct_publish';
      const updated: UserProfile = {
        ...user,
        role: newRole,
        publish_permission: user.publish_permission || autoPerm,
        allowed_sections: user.allowed_sections || (newRole === 'reporter' ? DEFAULT_REPORTER_SECTIONS : ALL_APP_SECTIONS)
      };
      localStore.saveUser(updated);
      loadData();
      setSuccessToast(`युझर ${user.full_name} चा रोल "${newRole}" मध्ये बदलण्यात आला.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const handleTogglePublishPermission = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const current = user.publish_permission || (user.role === 'reporter' ? 'needs_approval' : 'direct_publish');
      const nextPerm: PublishPermission = current === 'needs_approval' ? 'direct_publish' : 'needs_approval';
      localStore.saveUser({ ...user, publish_permission: nextPerm });
      loadData();
      setSuccessToast(
        `युझर "${user.full_name}" चे अधिकार "${nextPerm === 'direct_publish' ? 'थेट प्रसिद्धी (Direct Publish)' : 'ॲडमिन मंजुरी आवश्यक (Send for Approval)'}" असे सेट केले.`
      );
      setTimeout(() => setSuccessToast(''), 3500);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('तुम्हाला खरोखर हा युझर काढून टाकायचा आहे का?')) {
      localStore.deleteUser(userId);
      loadData();
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleMeta: Record<UserRole, { label: string; badge: string; desc: string }> = {
    admin: {
      label: 'मुख्य व्यवस्थापक (Admin)',
      badge: 'bg-red-500/15 text-red-300 border-red-500/30',
      desc: 'सर्व ७ सेक्शन्सचा पूर्ण ॲक्सेस, युझर मॅनेजमेंट, सिंक सेटिंग्स व थेट प्रकाशन'
    },
    editor: {
      label: 'उप-संपादक (Editor)',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      desc: 'मजकूर तपासणे, बदलणे, मंजुरी देणे व थेट वेबसाइटवर प्रकाशित करणे'
    },
    reporter: {
      label: 'डेटा ऑपरेटर (Reporter)',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      desc: 'फक्त नेमून दिलेल्या सेक्शन्समध्ये डेटा भरणे (थेट किंवा मंजुरीसाठी)'
    }
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">ॲक्सेस मर्यादित (Access Denied)</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          युझर मॅनेजमेंट ॲडमिन पॅनेल फक्त मुख्य व्यवस्थापक (Super Admin - bhandara.sdfx@gmail.com) साठी राखीव आहे.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xl">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-amber-400" />
              <span>युझर व सेक्शन अधिकार व्यवस्थापन (Admin Panel)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              {users.length} युझर्स
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            प्रत्येक युझरला <strong>कोणते सेक्शन्स (मॉड्यूल्स)</strong> अपडेट किंवा पब्लिश करता येतील आणि <strong>थेट प्रसिद्धी किंवा ॲडमिन मंजुरी</strong> याचे संपूर्ण नियंत्रण.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>नवीन युझर जोडा</span>
        </button>
      </div>

      {/* Role & Permissions Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['admin', 'editor', 'reporter'] as UserRole[]).map((r) => {
          const count = users.filter(u => u.role === r).length;
          const meta = roleMeta[r];
          return (
            <div key={r} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${meta.badge}`}>
                  {meta.label}
                </span>
                <span className="text-xs font-bold text-slate-400">{count} खाती</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pt-1">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="नावाने किंवा ईमेलने शोधा..."
          className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 outline-none w-full"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">युझर नाव व तपशील</th>
                <th className="py-3.5 px-4 font-semibold">ईमेल व संपर्क</th>
                <th className="py-3.5 px-4 font-semibold">रोल (Role)</th>
                <th className="py-3.5 px-4 font-semibold">प्रकाशन अधिकार</th>
                <th className="py-3.5 px-4 font-semibold">उपलब्ध सेक्शन्स (Allowed Sections)</th>
                <th className="py-3.5 px-4 font-semibold">खाते स्थिती</th>
                <th className="py-3.5 px-4 font-semibold text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isApproval = u.publish_permission === 'needs_approval' || (!u.publish_permission && u.role === 'reporter');
                const userSections = u.allowed_sections && u.allowed_sections.length > 0
                  ? u.allowed_sections
                  : (u.role === 'reporter' ? DEFAULT_REPORTER_SECTIONS : ALL_APP_SECTIONS);
                const hasAllSections = userSections.length === ALL_APP_SECTIONS.length;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0">
                        {u.full_name ? u.full_name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100">{u.full_name}</div>
                        <div className="text-[11px] text-slate-500">ID: {u.id}</div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      <div className="font-mono text-[11px] text-slate-200">{u.email}</div>
                      {u.phone && <div className="text-[11px] text-slate-500">{u.phone}</div>}
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                      >
                        <option value="admin">👑 मुख्य ॲडमिन</option>
                        <option value="editor">✍️ उप-संपादक</option>
                        <option value="reporter">📝 डेटा ऑपरेटर</option>
                      </select>
                    </td>

                    {/* Publishing Permission Column: Direct Publish OR Send for Approval */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublishPermission(u.id)}
                        title="अधिकार बदलण्यासाठी क्लिक करा"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition duration-150 ${
                          isApproval
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/50'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/50'
                        }`}
                      >
                        {isApproval ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>🟡 ॲडमिन मंजुरी (Approval)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>🟢 थेट प्रसिद्धी (Direct)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Allowed Sections Column with Interactive Chips & Quick Edit */}
                    <td className="py-4 px-4">
                      <div className="space-y-1.5 max-w-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-400">
                            {hasAllSections ? (
                              <span className="text-emerald-400 font-bold">✓ सर्व ७ सेक्शन्स</span>
                            ) : (
                              <span className="text-amber-400">{userSections.length} सेक्शन्स उपलब्ध</span>
                            )}
                          </span>
                          <button
                            onClick={() => openEditModal(u)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>बदला</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {AVAILABLE_SECTIONS.map((sec) => {
                            const isAllowed = userSections.includes(sec.id);
                            return (
                              <span
                                key={sec.id}
                                title={`${sec.label}: ${isAllowed ? 'परवानगी आहे' : 'परवानगी नाही'}`}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${
                                  isAllowed
                                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                                    : 'bg-slate-950/60 text-slate-600 border-slate-900 line-through opacity-40'
                                }`}
                              >
                                <span>{sec.icon}</span>
                                <span>{sec.id}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                          u.is_active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>सक्रिय (Active)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>निष्क्रिय</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          title="युझर व सेक्शन अधिकार संपादित करा"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.email !== 'bhandara.sdfx@gmail.com' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            title="युझर काढून टाका"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal with Sections & Publishing Permissions */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-5 animate-scale-up my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {editingUser ? (
                    <>
                      <Edit2 className="w-5 h-5 text-amber-400" />
                      <span>युझर व सेक्शन अधिकार संपादन (Edit User & Permissions)</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 text-amber-400" />
                      <span>नवीन युझर नोंदणी व सेक्शन अधिकार (Add New User)</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  युझरला कोणते सेक्शन्स अपडेट किंवा पब्लिश करता येतील आणि थेट प्रसिद्धी अधिकार निवडा.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">पूर्ण नाव *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. राहुल देशमुख"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ईमेल पत्ता *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@rajkumarbadole.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">मोबाईल नंबर</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">रोल निवडा *</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="reporter">📝 डेटा ऑपरेटर (Reporter)</option>
                    <option value="editor">✍️ उप-संपादक (Editor)</option>
                    <option value="admin">👑 मुख्य व्यवस्थापक (Admin)</option>
                  </select>
                </div>
              </div>

              {/* Direct Publish OR Admin Approval Selection */}
              <div className="pt-1">
                <label className="block text-slate-200 font-bold mb-2 flex items-center justify-between">
                  <span>प्रकाशन अधिकार निवडा (Publishing Option) *</span>
                  <span className="text-[11px] text-amber-400 font-normal">कामाचे स्वरूप ठरवा</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Direct Publish */}
                  <div
                    onClick={() => setPublishPermission('direct_publish')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                      publishPermission === 'direct_publish'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>थेट प्रसिद्ध करा (Direct Publish)</span>
                      </span>
                      <input
                        type="radio"
                        name="publishPermission"
                        checked={publishPermission === 'direct_publish'}
                        onChange={() => setPublishPermission('direct_publish')}
                        className="accent-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      हा युझर परवानगी दिलेल्या सेक्शन्समध्ये डेटा थेट वेबसाइटवर (rajkumarbadole.in) प्रकाशित करू शकतो.
                    </p>
                  </div>

                  {/* Option 2: Send for Admin Approval */}
                  <div
                    onClick={() => setPublishPermission('needs_approval')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                      publishPermission === 'needs_approval'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>ॲडमिन मंजुरी आवश्यक (Approval)</span>
                      </span>
                      <input
                        type="radio"
                        name="publishPermission"
                        checked={publishPermission === 'needs_approval'}
                        onChange={() => setPublishPermission('needs_approval')}
                        className="accent-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      तयार केलेला डेटा आधी मुख्य ॲडमिनकडे मंजुरीसाठी जाईल. ॲडमिनच्या मंजुरीनंतरच वेबसाइटवर लाईव्ह होईल.
                    </p>
                  </div>
                </div>
              </div>

              {/* CORE REQUIREMENT: Section Selection Checkboxes */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>कोणते सेक्शन्स अपडेट किंवा पब्लिश करता येतील? (Allowed Sections) *</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      युझरला फक्त निवडलेल्या सेक्शन्सचाच डॅशबोर्ड व मेन्यूमध्ये ॲक्सेस दिसेल.
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={selectAllSections}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold border border-slate-700 transition"
                    >
                      सर्व ७ निवडा
                    </button>
                    <button
                      type="button"
                      onClick={selectStandardReporterSections}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition"
                    >
                      डिफॉल्ट (४)
                    </button>
                    <button
                      type="button"
                      onClick={clearAllSections}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-semibold border border-slate-700 transition"
                    >
                      काहीही नाही
                    </button>
                  </div>
                </div>

                {/* Section Checkboxes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {AVAILABLE_SECTIONS.map((sec) => {
                    const isChecked = selectedSections.includes(sec.id);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => toggleSection(sec.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{sec.icon}</span>
                          <div className="min-w-0">
                            <div className={`font-bold text-xs truncate ${isChecked ? 'text-amber-300' : 'text-slate-300'}`}>
                              {sec.label}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{sec.sublabel}</div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>
                    निवडलेले सेक्शन्स: <strong className="text-amber-400">{selectedSections.length}</strong> पैकी {AVAILABLE_SECTIONS.length}
                  </span>
                  {selectedSections.length === 0 && (
                    <span className="text-rose-400 font-semibold">⚠️ किमान १ सेक्शन निवडणे आवश्यक आहे</span>
                  )}
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">प्रारंभिक पासवर्ड</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="उदा. badole@2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3">
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
                  {editingUser ? 'बदल सेव्ह करा' : 'युझर सेव्ह करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
