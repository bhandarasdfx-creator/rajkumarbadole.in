'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { AppSection, UserProfile } from '@/lib/types';

interface SectionGuardProps {
  section: AppSection;
  sectionTitle: string;
  children: React.ReactNode;
}

export default function SectionGuard({ section, sectionTitle, children }: SectionGuardProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setUser(localStore.getCurrentUser());
    };
    handleUpdate();
    setMounted(true);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('rb_user_changed', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('rb_user_changed', handleUpdate);
    };
  }, []);

  if (!mounted) return <>{children}</>;

  const hasAccess =
    !user ||
    user.role === 'admin' ||
    (user.allowed_sections && user.allowed_sections.includes(section));

  if (!hasAccess) {
    return (
      <div className="p-8 md:p-12 text-center rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-2xl mx-auto space-y-6 mt-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>ॲक्सेस मर्यादित (Restricted Section)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            {sectionTitle} विभागाचा ॲक्सेस नाही
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            मुख्य व्यवस्थापकाने (Admin) तुमच्या खात्याला या विभागामध्ये (Section) डेटा भरण्याचे, संपादित करण्याचे किंवा प्रकाशित करण्याचे अधिकार दिलेले नाहीत.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left max-w-md mx-auto">
          <div className="text-xs font-bold text-slate-300 mb-2">तुमचे सध्याचे अधिकार व उपलब्ध सेक्शन्स:</div>
          <div className="flex flex-wrap gap-1.5">
            {(user?.allowed_sections || []).length > 0 ? (
              user?.allowed_sections?.map((sec) => (
                <span
                  key={sec}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold"
                >
                  ✓ {sec}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">कोणतेही सेक्शन्स नेमून दिलेले नाहीत.</span>
            )}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>डॅशबोर्डवर परत जा</span>
          </Link>
          <Link
            href="/dashboard/news"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <span>बातम्या विभागात जा</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
