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
  Check
} from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('reporter');
  const [password, setPassword] = useState('');

  const loadData = () => {
    setCurrentUser(localStore.getCurrentUser());
    setUsers(localStore.getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      full_name: name,
      email,
      phone,
      role,
      is_active: true,
      created_at: new Date().toISOString()
    };

    localStore.saveUser(newUser);
    loadData();
    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSuccessToast(`नवीन युझर "${name}" यशस्वीरीत्या तयार करण्यात आला!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleToggleStatus = (userId: string) => {
    localStore.toggleUserStatus(userId);
    loadData();
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      localStore.saveUser({ ...user, role: newRole });
      loadData();
      setSuccessToast(`युझर ${user.full_name} चा रोल "${newRole}" मध्ये बदलण्यात आला.`);
      setTimeout(() => setSuccessToast(''), 3000);
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
      desc: 'सर्व अधिकार, युझर मॅनेजमेंट, सिस्टम सेटिंग्स'
    },
    editor: {
      label: 'उप-संपादक (Editor)',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      desc: 'मजकूर तपासणे, बदलणे व थेट प्रकाशित करणे'
    },
    reporter: {
      label: 'डेटा ऑपरेटर (Reporter)',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      desc: 'बातम्या, विकासकामे, फोटो व व्हिडिओ सबमिट करणे'
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
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xl">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-amber-400" />
              <span>युझर व्यवस्थापन (Admin Panel)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              {users.length} युझर्स
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            न्यूज रूमसाठी ऑपरेटर, संपादक आणि ॲडमिनच्या खात्यांचे संपूर्ण नियंत्रण.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>नवीन युझर जोडा</span>
        </button>
      </div>

      {/* Role Explainer Cards */}
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
                <th className="py-3.5 px-4 font-semibold">स्थिती (Status)</th>
                <th className="py-3.5 px-4 font-semibold">शेवटचा लॉगिन</th>
                <th className="py-3.5 px-4 font-semibold text-right">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const meta = roleMeta[u.role];
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
                      {/* Role Selector dropdown */}
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
                            <span>निष्क्रिय (Disabled)</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('mr-IN') : '—'}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {u.email !== 'bhandara.sdfx@gmail.com' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          title="युझर काढून टाका"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-5 animate-scale-up">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>नवीन युझर नोंदणी</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                मतदारसंघ कार्यालयातील नवीन व्यक्तीला न्यूज रूमचा ॲक्सेस द्या.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
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
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="reporter">📝 डेटा ऑपरेटर (Reporter) - बातम्या व कामांची नोंद</option>
                  <option value="editor">✍️ उप-संपादक (Editor) - मजकूर संपादन व प्रसिद्धी</option>
                  <option value="admin">👑 मुख्य व्यवस्थापक (Admin) - सर्व अधिकार</option>
                </select>
              </div>

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
                  युझर सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
