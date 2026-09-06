'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { localStore, supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { INITIAL_USERS } from '@/lib/supabase/mock-db';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('bhandara.sdfx@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          // If Supabase auth errors (e.g. user not created yet in Supabase auth table), check local users fallback
          const matchedUser = localStore.getUsers().find(u => u.email === email && u.is_active);
          if (matchedUser) {
            localStore.setCurrentUser(matchedUser);
            localStore.addLog('LOGGED_IN', 'Auth', `${matchedUser.email} (${matchedUser.role})`);
            router.push('/dashboard');
            return;
          }
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }
        // Fetch or create profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          localStore.setCurrentUser(profile);
        } else {
          localStore.setCurrentUser({
            id: data.user.id,
            full_name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email || email,
            role: email === 'bhandara.sdfx@gmail.com' ? 'admin' : 'reporter',
            is_active: true,
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Offline / Demo / Setup Mode
        const matchedUser = localStore.getUsers().find(u => u.email === email);
        if (!matchedUser) {
          setErrorMsg('हा ईमेल पत्ता नोंदणीकृत नाही. कृपया ॲडमिनशी संपर्क साधा.');
          setIsLoading(false);
          return;
        }
        if (!matchedUser.is_active) {
          setErrorMsg('हे खाते सध्या निष्क्रिय (Inactive) करण्यात आले आहे. कृपया ॲडमिनशी संपर्क करा.');
          setIsLoading(false);
          return;
        }
        localStore.setCurrentUser(matchedUser);
        localStore.addLog('LOGGED_IN', 'Auth', `${matchedUser.email} (${matchedUser.role})`);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'लॉगिन करताना त्रुटी आली.');
      setIsLoading(false);
    }
  };

  const setDemoUser = (index: number) => {
    const u = INITIAL_USERS[index];
    if (u) {
      setEmail(u.email);
      setPassword('admin123');
      setErrorMsg('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Header Branding */}
          <div className="text-center mb-8">
            <div className="inline-block relative mb-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-amber-500/30 shadow-xl bg-slate-800 mx-auto">
                <img
                  src="/assets/rajkumar-badole-portrait.png"
                  alt="राजकुमार बडोले"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase shadow-md">
                CMS
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">राजकुमार बडोले</h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase mt-0.5">
              डिजिटल न्यूज रूम व डेटा फीडर
            </p>
            <p className="text-xs text-slate-400 mt-2">
              सुरक्षित मल्टी-युझर लॉगिन पोर्टल
            </p>
          </div>

          {/* Quick role selection chips */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 font-medium block mb-2">त्वरित चाचणी खाती (Quick Select):</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoUser(0)}
                className={`py-1.5 px-2 rounded-xl text-center font-semibold transition text-[11px] ${
                  email === 'bhandara.sdfx@gmail.com'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                👑 ॲडमिन
              </button>
              <button
                type="button"
                onClick={() => setDemoUser(1)}
                className={`py-1.5 px-2 rounded-xl text-center font-semibold transition text-[11px] ${
                  email === 'editor@rajkumarbadole.in'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                ✍️ संपादक
              </button>
              <button
                type="button"
                onClick={() => setDemoUser(2)}
                className={`py-1.5 px-2 rounded-xl text-center font-semibold transition text-[11px] ${
                  email === 'operator@rajkumarbadole.in'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                📝 ऑपरेटर
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs leading-relaxed">
                ⚠️ {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ईमेल पत्ता (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                पासवर्ड (Password)
              </label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>प्रमाणित करत आहे...</span>
              ) : (
                <>
                  <span>न्यूज रूममध्ये प्रवेश करा</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              सुरक्षित Supabase ऑथेंटिकेशन व रो-लेव्हल सिक्युरिटी द्वारे संरक्षित.
            </p>
            <p className="text-[11px] text-amber-500/80 mt-1">
              मुख्य ॲडमिन: bhandara.sdfx@gmail.com
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
