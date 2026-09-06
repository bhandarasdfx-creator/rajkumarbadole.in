'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
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
  X,
  Eye,
  EyeOff,
  User,
  Key,
  RefreshCw,
  AlertTriangle
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
  const [successToast, setSuccessToast] = useState('');

  // 1. Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('reporter');
  const [publishPermission, setPublishPermission] = useState<PublishPermission>('needs_approval');
  const [selectedSections, setSelectedSections] = useState<AppSection[]>(DEFAULT_REPORTER_SECTIONS);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2. Set Username & Password Dedicated Modal State
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credsUser, setCredsUser] = useState<UserProfile | null>(null);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credShowPass, setCredShowPass] = useState(false);

  // 3. Remove / Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setUsers(localStore.getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Add User Handlers ---
  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setRole('reporter');
    setPublishPermission('needs_approval');
    setSelectedSections(['news', 'works', 'events', 'gallery']);
    setPassword('badole@2026');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // --- Edit User Handlers ---
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setName(user.full_name);
    setUsername(user.username || user.email.split('@')[0]);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setPublishPermission(user.publish_permission || (user.role === 'reporter' ? 'needs_approval' : 'direct_publish'));
    setSelectedSections(user.allowed_sections && user.allowed_sections.length > 0 ? user.allowed_sections : ALL_APP_SECTIONS);
    setPassword(user.password || '');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // --- Quick Set Username & Password Handlers ---
  const openCredsModal = (user: UserProfile) => {
    setCredsUser(user);
    setCredUsername(user.username || user.email.split('@')[0]);
    setCredPassword(user.password || 'admin123');
    setCredShowPass(false);
    setIsCredsModalOpen(true);
  };

  const generateRandomPassword = (forCredsModal = false) => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const gen = `rb@${rand}`;
    if (forCredsModal) {
      setCredPassword(gen);
    } else {
      setPassword(gen);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingUser && !username) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setUsername(generated);
    }
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

  const selectAllSections = () => setSelectedSections(ALL_APP_SECTIONS);
  const clearAllSections = () => setSelectedSections([]);
  const selectStandardReporterSections = () => setSelectedSections(['news', 'works', 'events', 'gallery']);

  // --- Save User (Add / Edit) ---
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (selectedSections.length === 0) {
      alert('कृपया युझरसाठी किमान एक सेक्शन निवडा!');
      return;
    }

    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check duplicate username if changed
    const duplicate = users.find(u =>
      u.id !== editingUser?.id &&
      u.username?.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      alert(`युझरनेम "@${cleanUsername}" आधीच अस्तित्वात आहे. कृपया वेगळे युझरनेम टाका.`);
      return;
    }

    if (editingUser) {
      const updated: UserProfile = {
        ...editingUser,
        full_name: name,
        username: cleanUsername,
        email,
        phone,
        role,
        publish_permission: publishPermission,
        allowed_sections: selectedSections,
        password: password || editingUser.password || 'admin123'
      };
      localStore.saveUser(updated);

      if (currentUser?.id === updated.id) {
        localStore.setCurrentUser(updated);
        setCurrentUser(updated);
      }

      setSuccessToast(`युझर "${name}" (@${cleanUsername}) ची माहिती व अधिकार यशस्वीरीत्या सेव्ह केले!`);
    } else {
      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        full_name: name,
        username: cleanUsername,
        email,
        phone,
        role,
        publish_permission: publishPermission,
        allowed_sections: selectedSections,
        password: password || 'badole@2026',
        is_active: true,
        created_at: new Date().toISOString()
      };
      localStore.saveUser(newUser);
      setSuccessToast(`नवीन युझर "${name}" (@${cleanUsername}) यशस्वीरीत्या तयार झाला!`);
    }

    loadData();
    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // --- Save Dedicated Credentials (Set Username & Password) ---
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credsUser) return;

    const cleanUsername = credUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      alert('कृपया युझरनेम प्रविष्ट करा!');
      return;
    }

    if (!credPassword) {
      alert('कृपया पासवर्ड प्रविष्ट करा!');
      return;
    }

    // Check duplicate username
    const duplicate = users.find(u =>
      u.id !== credsUser.id &&
      u.username?.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      alert(`युझरनेम "@${cleanUsername}" आधीच अस्तित्वात आहे. कृपया दुसरे युझरनेम टाका.`);
      return;
    }

    const updated: UserProfile = {
      ...credsUser,
      username: cleanUsername,
      password: credPassword
    };

    localStore.saveUser(updated);

    if (currentUser?.id === updated.id) {
      localStore.setCurrentUser(updated);
      setCurrentUser(updated);
    }

    loadData();
    setIsCredsModalOpen(false);
    setSuccessToast(`युझर "${credsUser.full_name}" चे युझरनेम (@${cleanUsername}) आणि पासवर्ड यशस्वीरीत्या बदलले!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // --- Toggle User Active Status ---
  const handleToggleStatus = (userId: string) => {
    localStore.toggleUserStatus(userId);
    loadData();
  };

  // --- Change User Role ---
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

  // --- Toggle Publish Permission ---
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

  // --- Remove / Delete User ---
  const confirmDeleteUser = (user: UserProfile) => {
    if (user.email === 'bhandara.sdfx@gmail.com' || user.username === 'admin') {
      alert('मुख्य सुपर ॲडमिन खाते सुरक्षित असल्याने काढून टाकता येत नाही.');
      return;
    }
    setUserToDelete(user);
  };

  const handleExecuteDelete = () => {
    if (!userToDelete) return;
    const deletedName = userToDelete.full_name;
    localStore.deleteUser(userToDelete.id);
    loadData();
    setUserToDelete(null);
    setSuccessToast(`युझर "${deletedName}" प्रणालीतून यशस्वीरीत्या काढून टाकण्यात आला.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
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
              <span>युझर व्यवस्थापन (User Management Panel)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              {users.length} युझर्स
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            युझर्स जोडा (Add), संपादित करा (Edit), काढून टाका (Remove), आणि प्रत्येकाचे <strong>युझरनेम व पासवर्ड (Set Username & Password)</strong> नियंत्रित करा.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>नवीन युझर जोडा (Add User)</span>
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
          placeholder="नाव, युझरनेम किंवा ईमेलने शोधा..."
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
                <th className="py-3.5 px-4 font-semibold">युझरनेम व पासवर्ड</th>
                <th className="py-3.5 px-4 font-semibold">ईमेल व फोन</th>
                <th className="py-3.5 px-4 font-semibold">रोल (Role)</th>
                <th className="py-3.5 px-4 font-semibold">प्रकाशन अधिकार</th>
                <th className="py-3.5 px-4 font-semibold">उपलब्ध सेक्शन्स</th>
                <th className="py-3.5 px-4 font-semibold">खाते स्थिती</th>
                <th className="py-3.5 px-4 font-semibold text-right">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isApproval = u.publish_permission === 'needs_approval' || (!u.publish_permission && u.role === 'reporter');
                const userSections = u.allowed_sections && u.allowed_sections.length > 0
                  ? u.allowed_sections
                  : (u.role === 'reporter' ? DEFAULT_REPORTER_SECTIONS : ALL_APP_SECTIONS);
                const hasAllSections = userSections.length === ALL_APP_SECTIONS.length;
                const isSuperAdmin = u.email === 'bhandara.sdfx@gmail.com' || u.username === 'admin';

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    {/* User Name & Details */}
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0">
                        {u.full_name ? u.full_name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                              सुपर ॲडमिन
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">ID: {u.id}</div>
                      </div>
                    </td>

                    {/* Username & Password Display + Quick Key Button */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            @{u.username || u.email.split('@')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono">पासवर्ड: {u.password ? '••••••••' : 'सेट नाही'}</span>
                          <button
                            onClick={() => openCredsModal(u)}
                            title="युझरनेम किंवा पासवर्ड बदला"
                            className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-0.5 text-[10px]"
                          >
                            <Key className="w-2.5 h-2.5" />
                            <span>बदला</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-4 px-4 text-slate-300">
                      <div className="font-mono text-[11px] text-slate-200">{u.email}</div>
                      {u.phone && <div className="text-[11px] text-slate-500">{u.phone}</div>}
                    </td>

                    {/* Role dropdown */}
                    <td className="py-4 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                      >
                        <option value="admin">👑 मुख्य ॲडमिन</option>
                        <option value="editor">✍️ उप-संपादक</option>
                        <option value="reporter">📝 डेटा ऑपरेटर</option>
                      </select>
                    </td>

                    {/* Publishing Permission */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublishPermission(u.id)}
                        title="अधिकार बदलण्यासाठी क्लिक करा"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition duration-150 ${
                          isApproval
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                        }`}
                      >
                        {isApproval ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>🟡 मंजुरी (Approval)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>🟢 थेट (Direct)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Allowed Sections Chips */}
                    <td className="py-4 px-4">
                      <div className="space-y-1 max-w-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-400">
                            {hasAllSections ? (
                              <span className="text-emerald-400 font-bold">✓ सर्व ७ सेक्शन्स</span>
                            ) : (
                              <span className="text-amber-400">{userSections.length} सेक्शन्स</span>
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
                                    : 'bg-slate-950/60 text-slate-600 border-slate-900 line-through opacity-30'
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

                    {/* Account Status Toggle */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition ${
                          u.is_active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>सक्रिय</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>निष्क्रिय</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions: Set Credentials, Edit, Delete */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Set Username & Password */}
                        <button
                          onClick={() => openCredsModal(u)}
                          title="युझरनेम आणि पासवर्ड सेट करा"
                          className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 transition border border-amber-500/20"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Full Edit */}
                        <button
                          onClick={() => openEditModal(u)}
                          title="युझर माहिती व सेक्शन्स संपादित करा"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove / Delete User */}
                        {!isSuperAdmin && (
                          <button
                            onClick={() => confirmDeleteUser(u)}
                            title="युझर काढून टाका (Remove)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ------------------------------------------------------------- */}
      {/* 1. ADD / EDIT USER MODAL                                      */}
      {/* ------------------------------------------------------------- */}
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
                      <span>युझर माहिती व अधिकार संपादन (Edit User)</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 text-amber-400" />
                      <span>नवीन युझर जोडा (Add New User)</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  नाव, युझरनेम, पासवर्ड, ईमेल, रोल आणि परवानगी असलेले सेक्शन्स सेट करा.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">पूर्ण नाव (Full Name) *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="उदा. राहुल देशमुख"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    युझरनेम (Username - लॉगिनसाठी) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-amber-400 font-mono font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="rahul_deshmukh"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">लहान अक्षरे (a-z), आकडे आणि _ वापरा</span>
                </div>
              </div>

              {/* Password with Show/Hide & Auto-generate */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>लॉगिन पासवर्ड (Set Password) *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateRandomPassword(false)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>नवीन जनरेट करा</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      <span>{showPassword ? 'लपवा' : 'दाखवा'}</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'पूर्वीचा पासवर्ड तसाच ठेवण्यासाठी रिकामे ठेवा किंवा नवीन टाका' : 'उदा. badole@2026'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-slate-100 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">रोल निवडा (Select Role) *</label>
                <select
                  value={role}
                  onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="reporter">📝 डेटा ऑपरेटर (Reporter - फक्त नेमून दिलेले सेक्शन्स)</option>
                  <option value="editor">✍️ उप-संपादक (Editor - मजकूर तपासणे व थेट प्रसिद्धी)</option>
                  <option value="admin">👑 मुख्य व्यवस्थापक (Admin - सर्व अधिकार व युझर मॅनेजमेंट)</option>
                </select>
              </div>

              {/* Direct Publish OR Admin Approval Selection */}
              <div className="pt-1">
                <label className="block text-slate-200 font-bold mb-2 flex items-center justify-between">
                  <span>प्रकाशन अधिकार निवडा (Publishing Option) *</span>
                  <span className="text-[11px] text-amber-400 font-normal">कामाचे स्वरूप ठरवा</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPublishPermission('direct_publish')}
                    className={`p-3 rounded-2xl border cursor-pointer transition select-none ${
                      publishPermission === 'direct_publish'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
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

                  <div
                    onClick={() => setPublishPermission('needs_approval')}
                    className={`p-3 rounded-2xl border cursor-pointer transition select-none ${
                      publishPermission === 'needs_approval'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
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

              {/* Allowed Sections Checkboxes */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {AVAILABLE_SECTIONS.map((sec) => {
                    const isChecked = selectedSections.includes(sec.id);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => toggleSection(sec.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{sec.icon}</span>
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
                            onChange={() => {}}
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
                  {editingUser ? 'बदल सेव्ह करा (Save Changes)' : 'युझर तयार करा (Create User)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DEDICATED QUICK SET USERNAME & PASSWORD MODAL               */}
      {/* ------------------------------------------------------------- */}
      {isCredsModalOpen && credsUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <span>युझरनेम व पासवर्ड सेट करा</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  <strong>{credsUser.full_name}</strong> साठी नवीन लॉगिन क्रेडेंशियल्स ठरवा.
                </p>
              </div>
              <button
                onClick={() => setIsCredsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
              {/* Username Field */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  युझरनेम (Username) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-amber-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={credUsername}
                    onChange={(e) => setCredUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">युझर लॉगिन करताना हा युझरनेम वापरू शकतो.</span>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    नवीन पासवर्ड (Password) *
                  </label>
                  <button
                    type="button"
                    onClick={() => generateRandomPassword(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>रँडम पासवर्ड जनरेट करा</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={credShowPass ? 'text' : 'password'}
                    required
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCredShowPass(!credShowPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {credShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-[11px] leading-relaxed">
                💡 <strong>टीप:</strong> हा पासवर्ड बदलल्यानंतर युझर त्याच्या नवीन युझरनेम व पासवर्डने लगेच लॉगिन करू शकेल.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCredsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>क्रेडेंशियल्स सेव्ह करा</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. REMOVE / DELETE USER CONFIRMATION MODAL                    */}
      {/* ------------------------------------------------------------- */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">युझर काढून टाका (Remove User)</h3>
              <p className="text-xs text-slate-400">
                तुम्हाला खरोखर हा युझर सिस्टीममधून काढून टाकायचा आहे का?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 text-left">
              <div className="font-bold text-white">{userToDelete.full_name}</div>
              <div className="text-amber-400 font-mono">@{userToDelete.username || 'user'}</div>
              <div className="text-slate-400">{userToDelete.email}</div>
              <div className="text-[11px] text-slate-500">रोल: {userToDelete.role}</div>
            </div>

            <p className="text-[11px] text-rose-400/90 text-center">
              ⚠️ हा युझर काढून टाकल्यास त्याचे लॉगिन आणि डॅशबोर्ड अधिकार लगेच बंद होतील.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>काढून टाका (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
