'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { localStore } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const user = localStore.getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else {
      setCurrentUser(user);
      setIsLoaded(true);
    }
  }, [router]);

  const handleRoleSwitch = (role: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    localStore.setCurrentUser(updated);
    setCurrentUser(updated);
  };

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mr-3" />
        <span>लोड होत आहे...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-marathi">
      <Sidebar currentUser={currentUser} onUserSwitch={handleRoleSwitch} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentUser={currentUser} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
