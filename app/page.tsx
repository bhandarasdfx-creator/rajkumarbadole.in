'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { localStore } from '@/lib/supabase/client';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStore.getCurrentUser();
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-sm">
      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
      <p>राजकुमार बडोले न्यूज रूम लोड होत आहे...</p>
    </div>
  );
}
