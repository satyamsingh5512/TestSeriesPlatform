'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

const VIOLATION_COLORS: Record<string, string> = {
  TAB_SWITCH:       'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  FULLSCREEN_EXIT:  'bg-orange-500/10 border-orange-500/30 text-orange-300',
  COPY_PASTE_ATTEMPT: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  NO_FACE:          'bg-red-500/10 border-red-500/30 text-red-300',
  MULTIPLE_FACES:   'bg-red-700/10 border-red-700/30 text-red-400',
  PHONE_DETECTED:   'bg-pink-500/10 border-pink-500/30 text-pink-300',
};

const STATUS_OPTIONS = ['flagged', 'suspicious', 'cleared', 'under_review'];
const STATUS_STYLES: Record<string, string> = {
  flagged:      'bg-slate-700 text-slate-300',
  suspicious:   'bg-red-600/20 text-red-300',
  cleared:      'bg-green-600/20 text-green-300',
  under_review: 'bg-yellow-600/20 text-yellow-300',
};

export default function ProctoringPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient().get(`/api/admin/attempts/${attemptId}/violations`)
      .then(r => setData(r.data))
      .catch(() => router.push('/admin/exams'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  async function updateStatus(violationId: string, status: string) {
    await apiClient().patch(`/api/admin/attempts/${attemptId}/violations/${violationId}`, { status });
    setData((prev: any) => ({
      ...prev,
      violations: prev.violations.map((v: any) => v.id === violationId ? { ...v, status } : v),
    }));
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { attempt, violations, auto_flagged } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-white/3 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14m0 0V10m0 4l-8 4V6l8 4z" />
            </svg>
          </div>
          <span className="text-white font-semibold">Proctoring Review</span>
        </div>
        <Link href="/admin/exams" className="text-blue-400 hover:text-blue-300 text-sm transition">
          ← Back to Exams
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Attempt Header */}
        <div className={`rounded-2xl p-6 mb-8 border ${auto_flagged ? 'bg-red-500/5 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white text-xl font-bold mb-1">{attempt?.student_name}</h1>
              <p className="text-slate-400 text-sm">{attempt?.exam_title}</p>
              <p className="text-slate-500 text-xs mt-1">{attempt?.email}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold mb-2 ${auto_flagged ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-green-500/20 text-green-300 border border-green-500/40'}`}>
                {auto_flagged ? '🚨 Auto-Flagged (>5 violations)' : '✅ Within Limits'}
              </div>
              <div className="text-slate-400 text-sm">
                {violations.length} violation{violations.length !== 1 ? 's' : ''} total
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <h2 className="text-white font-semibold text-lg mb-4">Violation Timeline</h2>
        {violations.length === 0 ? (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8 text-center text-green-400">
            ✅ No violations recorded for this attempt.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700" />

            <div className="space-y-4">
              {violations.map((v: any, i: number) => (
                <div key={v.id} className="relative flex gap-5 items-start pl-12">
                  {/* Dot */}
                  <div className={`absolute left-3 top-3 w-4 h-4 rounded-full border-2 border-slate-800 ${auto_flagged ? 'bg-red-500' : 'bg-yellow-500'}`} />

                  <div className={`flex-1 border rounded-xl p-4 ${VIOLATION_COLORS[v.type] || 'bg-slate-700/30 border-slate-600 text-slate-300'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-sm mb-1">{v.type.replace(/_/g, ' ')}</div>
                        <div className="text-xs opacity-70">
                          {new Date(v.occurred_at).toLocaleString()}
                        </div>
                        {v.details && Object.keys(v.details).length > 0 && (
                          <div className="mt-2 text-xs opacity-70 font-mono">
                            {JSON.stringify(v.details)}
                          </div>
                        )}
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={v.status || 'flagged'}
                        onChange={(e) => updateStatus(v.id, e.target.value)}
                        className={`text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-white cursor-pointer focus:outline-none ${STATUS_STYLES[v.status] || ''}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
