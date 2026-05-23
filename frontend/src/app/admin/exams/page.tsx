'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Manrope } from 'next/font/google';
import { BookOpen, Clock, Target, Plus, ShieldCheck } from 'lucide-react';
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
const GlassCard = ({ children, className = '', hover = false, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-3xl  overflow-hidden ${hover ? 'hover:bg-white dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] cursor-pointer transition-all duration-500' : ''} ${className}`}
  >
    {children}
  </div>
);

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['admin', 'superadmin'].includes(user.role)) { router.push('/dashboard'); return; }
    apiClient().get('/api/admin/exams')
      .then(r => setExams(r.data.exams))
      .finally(() => setLoading(false));
  }, [router]);

  const togglePublish = async (exam: any) => {
    const newStatus = (exam.status === 'published' || exam.is_published) ? 'draft' : 'published';
    try {
      await apiClient().patch(`/api/admin/exams/${exam.id}`, { status: newStatus });
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus, is_published: newStatus === 'published' } : e));
    } catch {
       alert("Failed to toggle status");
    }
  };

  if (loading) return (
    <div className={`min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center ${manrope.className}`}>
      <div className="w-8 h-8 border-[3px] border-slate-300 dark:border-[#333333] border-t-slate-800 dark:border-t-white/80 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white/90 ${manrope.className} flex flex-col relative transition-colors duration-500`}>
      
      {/* --- Ambient Radial Glow Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-500 opacity-60 dark:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0a0a0a]  px-6 py-4 flex items-center justify-between transition-colors duration-500">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          <span className="text-slate-900 dark:text-white font-bold tracking-tight text-lg">ExamForge Admin</span>
        </div>
        <Link href="/dashboard" className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white transition-colors">Exam Management</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1 font-medium">Create, publish, and monitor active examinations.</p>
          </div>
          <Link
            href="/admin/exams/create"
            id="create-exam-btn"
            className="bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 font-bold px-6 py-3 rounded-2xl text-sm transition-transform shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Exam
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-[#222222] rounded-3xl bg-slate-100/50 dark:bg-[#0a0a0a] transition-colors duration-500">
            <BookOpen className="w-12 h-12 text-slate-400 dark:text-white/10 mb-3" />
            <p className="text-sm text-slate-500 dark:text-white/30 font-medium">No exams yet. Create your first exam.</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            {exams.map(exam => (
              <motion.div key={exam.id} variants={fadeUp}>
                <GlassCard className="p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] bg-slate-200 dark:bg-[#222222] px-2 py-1 rounded text-slate-600 dark:text-white/50 font-bold uppercase tracking-widest transition-colors duration-500">
                         {exam.exam_type || 'fixed'}
                       </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate transition-colors">{exam.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-white/40 mt-2 transition-colors">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} min</span>
                      <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {exam.total_marks} marks</span>
                      <span>{exam.attempt_count || 0} attempts</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border transition-colors
                      ${(exam.status === 'published' || exam.is_published)
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-slate-200 dark:bg-[#222222] text-slate-600 dark:text-white/40 border-slate-300 dark:border-[#333333]'}`}>
                      {(exam.status === 'published' || exam.is_published) ? 'Published' : 'Draft'}
                    </span>
                    <button
                      id={`toggle-publish-${exam.id}`}
                      onClick={() => togglePublish(exam)}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#222222] hover:bg-slate-300 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/80 transition-colors"
                    >
                      {(exam.status === 'published' || exam.is_published) ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link
                       href={`/admin/proctoring`} // Placeholder, proctoring usually needs attemptId, not examId, but good to have a link
                       className="text-xs font-bold px-4 py-2 rounded-xl bg-violet-100 dark:bg-violet-500/10 hover:bg-violet-200 dark:hover:bg-violet-500/20 text-violet-700 dark:text-violet-400 transition-colors"
                    >
                       Proctoring Logs
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
