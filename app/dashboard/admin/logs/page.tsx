'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, Clock, User, FileText } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { ActivityLog, UserProfile } from '@/lib/types';

export default function AdminLogsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    setCurrentUser(localStore.getCurrentUser());
    setLogs(localStore.getLogs());
  }, []);

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">ॲक्सेस मर्यादित (Access Denied)</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          ऑडिट व ॲक्टिव्हिटी लॉग फक्त मुख्य व्यवस्थापक (Admin) साठी उपलब्ध आहे.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-amber-400" />
          <span>ॲक्टिव्हिटी ऑडिट लॉग (Audit Trail)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          कोणत्या टीम मेंबरने कधी कोणती बातमी, काम किंवा बदल केला याची अचूक नोंद.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">तारीख व वेळ</th>
                <th className="py-3.5 px-4 font-semibold">वापरकर्ता (User)</th>
                <th className="py-3.5 px-4 font-semibold">कृती (Action)</th>
                <th className="py-3.5 px-4 font-semibold">घटक प्रकार</th>
                <th className="py-3.5 px-4 font-semibold">तपशील / शीर्षक</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('mr-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-amber-400">
                    {log.user_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {log.entity_type}
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 font-semibold truncate max-w-xs">
                    {log.entity_title}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
