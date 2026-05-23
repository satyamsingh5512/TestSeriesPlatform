'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Manrope } from 'next/font/google';
import { ShieldCheck, ChevronLeft, AlertCircle, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Minimalist Motion System ---
const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } };
const staggerContainer = { animate: { transition: { staggerChildren: 0.05 } } };

// --- Reusable Glass Panel ---
const GlassCard = ({ children, className = '' }: any) => (
  <div className={`bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-3xl  overflow-hidden ${className}`}>
    {children}
  </div>
);

const VIOLATION_COLORS: Record<string, string> = {
  TAB_SWITCH:       'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
  FULLSCREEN_EXIT:  'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400',
  COPY_PASTE_ATTEMPT: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400',
  NO_FACE:          'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
  MULTIPLE_FACES:   'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400',
  PHONE_DETECTED:   'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-400',
  UNAUTHORIZED_KEY: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
  PAGE_UNLOAD:      'bg-red-100 dark:bg-red-600/20 border-red-300 dark:border-red-600/40 text-red-800 dark:text-red-300',
};

const STATUS_OPTIONS = ['flagged', 'suspicious', 'cleared', 'under_review'];

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
  }, [attemptId, router]);

  async function updateStatus(violationId: string, status: string) {
    try {
      await apiClient().patch(`/api/admin/violations/${violationId}`, { status });
      setData((prev: any) => ({
        ...prev,
        violations: prev.violations.map((v: any) => v.id === violationId ? { ...v, status } : v),
      }));
    } catch {
       alert("Failed to update status");
    }
  }

  if (loading) return (
    <div className={`min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center ${manrope.className}`}>
      <div className="w-8 h-8 border-[3px] border-slate-300 dark:border-[#333333] border-t-slate-800 dark:border-t-white/80 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { attempt, violations, auto_flagged } = data;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white/90 ${manrope.className} flex flex-col relative transition-colors duration-500 pb-20`}>
      
      {/* --- Ambient Radial Glow Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-500 opacity-60 dark:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0a0a0a]  px-6 py-4 flex items-center justify-between transition-colors duration-500 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          <span className="text-slate-900 dark:text-white font-bold tracking-tight text-lg">Proctoring Review</span>
        </div>
        <Link href="/admin/exams" className="flex items-center gap-1 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Exams
        </Link>
      </nav>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
        
        {/* Attempt Header */}
        <motion.div variants={fadeUp} initial="initial" animate="animate">
          <GlassCard className={`p-8 shadow-sm ${auto_flagged ? 'border-red-300 dark:border-red-500/30' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h1 className="text-slate-900 dark:text-white text-2xl font-black mb-1 transition-colors">{attempt?.student_name}</h1>
                <p className="text-slate-600 dark:text-white/60 text-sm font-bold flex items-center gap-2 mb-2 transition-colors">
                  <BookOpen className="w-4 h-4" /> {attempt?.exam_title}
                </p>
                <p className="text-slate-500 dark:text-white/40 text-xs font-medium transition-colors">{attempt?.email}</p>
              </div>
              <div className="text-left md:text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest mb-3 border transition-colors ${auto_flagged ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
                  {auto_flagged ? <><AlertCircle className="w-4 h-4" /> Auto-Flagged (&gt;5 violations)</> : <><CheckCircle2 className="w-4 h-4" /> Within Limits</>}
                </div>
                <div className="text-slate-600 dark:text-white/60 text-sm font-bold transition-colors">
                  {violations.length} violation{violations.length !== 1 ? 's' : ''} total
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Timeline */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2 transition-colors">
            <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Violation Timeline
          </h2>
          {violations.length === 0 ? (
            <GlassCard className="p-12 text-center shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
              <p className="text-emerald-700 dark:text-emerald-400 font-bold">No violations recorded for this attempt.</p>
            </GlassCard>
          ) : (
            <div className="relative pl-6 md:pl-8">
              {/* Vertical line */}
              <div className="absolute left-[11px] md:left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-[#333333] rounded-full" />

              <div className="space-y-6">
                {violations.map((v: any) => (
                  <motion.div key={v.id} variants={fadeUp} className="relative flex gap-6 items-start">
                    {/* Dot */}
                    <div className={`absolute -left-6 md:-left-[21px] top-6 w-3 h-3 rounded-full border-2 border-slate-50 dark:border-[#030303] shadow-sm z-10 ${auto_flagged ? 'bg-red-500' : 'bg-amber-500'}`} />

                    <GlassCard className={`flex-1 p-6 shadow-sm border-l-4 ${VIOLATION_COLORS[v.type] || 'bg-slate-100 dark:bg-[#111111] border-slate-300 dark:border-[#333333] text-slate-700 dark:text-white/80'} border-l-[color:inherit]`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-sm mb-1 uppercase tracking-widest">{v.type.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] font-bold opacity-60 mb-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(v.occurred_at).toLocaleString()}
                          </div>
                          {v.details && Object.keys(v.details).length > 0 && (
                            <div className="text-xs opacity-80 font-mono bg-white/50 dark:bg-[#0a0a0a] p-3 rounded-xl border border-inherit">
                              {JSON.stringify(v.details)}
                            </div>
                          )}
                        </div>

                        {/* Status Dropdown */}
                        <div className="flex-shrink-0">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-50 block mb-1">Status</label>
                          <select
                            value={v.status || 'flagged'}
                            onChange={(e) => updateStatus(v.id, e.target.value)}
                            className="text-xs font-bold px-4 py-2 rounded-xl border border-inherit bg-white/50 dark:bg-[#0a0a0a] text-inherit cursor-pointer focus:outline-none transition-colors"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
