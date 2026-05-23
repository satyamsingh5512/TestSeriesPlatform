'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Manrope } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Reusable Glass Panel ---
const GlassCard = ({ children, className = '' }: any) => (
  <div 
    className={`bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-3xl  overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    apiClient().get(`/api/attempts/${attemptId}/result`)
      .then(r => setResult(r.data))
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center ${manrope.className}`}>
        <div className="w-8 h-8 border-[3px] border-slate-300 dark:border-[#333333] border-t-slate-800 dark:border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const { total_score, max_score, accuracy_percent, percentile, questions, analysis, irt_theta, irt_label } = result;

  // ── Section breakdown ──────────────────────────────────────────────────────
  const sectionMap: Record<string, { title: string; earned: number; total: number }> = {};
  questions.forEach((q: any) => {
    if (!sectionMap[q.section_title]) {
      sectionMap[q.section_title] = { title: q.section_title, earned: 0, total: 0 };
    }
    sectionMap[q.section_title].earned += parseFloat(q.marks_awarded || 0);
    sectionMap[q.section_title].total += parseFloat(q.marks || 4);
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await apiClient().get(`/api/attempts/${attemptId}/report.pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${attemptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Failed to download PDF report.');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white/90 ${manrope.className} flex flex-col relative transition-colors duration-500`}>
      
      {/* --- Ambient Radial Glow Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-500 opacity-60 dark:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0a0a0a]  px-6 py-4 flex items-center justify-between transition-colors duration-500">
        <span className="text-slate-900 dark:text-white font-bold tracking-tight text-lg">ExamForge</span>
        <Link href="/dashboard" className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors">
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* ── Score Hero ─────────────────────────────────────────────────────── */}
        <GlassCard className="p-8 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold mb-6 bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-transparent">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Exam Complete
          </div>
          <div className="text-6xl font-black text-slate-900 dark:text-white mb-2 transition-colors">
            {Number(total_score).toFixed(0)}
            <span className="text-2xl text-slate-400 dark:text-white/40 font-medium"> / {Number(max_score).toFixed(0)}</span>
          </div>
          <p className="text-slate-500 dark:text-white/50 text-sm font-bold uppercase tracking-widest mb-8">Total Score</p>

          <div className="flex justify-center gap-10">
            <div>
              <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{accuracy_percent}%</div>
              <div className="text-slate-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            {percentile != null && (
              <div>
                <div className="text-3xl font-black text-violet-600 dark:text-violet-400">{Number(percentile).toFixed(1)}%</div>
                <div className="text-slate-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Percentile</div>
              </div>
            )}
          </div>

          {percentile != null && (
            <p className="text-slate-600 dark:text-white/60 text-sm mt-6 font-medium">
              You scored better than <span className="text-slate-900 dark:text-white font-bold">{Number(percentile).toFixed(1)}%</span> of students
            </p>
          )}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleDownloadPDF}
              className="bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 text-sm font-bold px-6 py-3 rounded-2xl transition-transform shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF Report
            </button>
          </div>
        </GlassCard>

        {/* ── IRT Ability Score Banner ────────────────────────────────────── */}
        {irt_theta !== null && irt_theta !== undefined && (
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/30 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">IRT Ability Score</div>
                <div className="text-slate-900 dark:text-white text-3xl font-black">{irt_theta !== null ? irt_theta.toFixed(2) : 'N/A'}</div>
                <p className="text-violet-700 dark:text-violet-200 text-sm mt-1 font-medium">
                  Your ability score of <strong>{irt_theta?.toFixed(2)}</strong> places you at <strong>{irt_label}</strong>
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-violet-400 dark:text-violet-300/60 mb-2">
                <span>-4 (Beginner)</span><span>0 (Average)</span><span>+4 (Expert)</span>
              </div>
              <div className="h-2 bg-violet-200 dark:bg-violet-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  style={{ width: `${Math.min(100, Math.max(0, ((irt_theta + 4) / 8) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Advanced Analysis — Topic Accuracy ────────────────────────────── */}
        {analysis?.topic_report && (
          <GlassCard className="p-6 shadow-sm">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-6">Topic Performance</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.topic_report}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} opacity={0.2} />
                  <XAxis dataKey="topic" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#e2e8f0', opacity: 0.1 }}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {analysis.topic_report.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.accuracy > 70 ? '#10b981' : entry.accuracy > 40 ? '#0ea5e9' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* ── Weakness Map & Insights ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassCard className="p-6 shadow-sm">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Focus Areas
            </h2>
            <div className="space-y-3">
              {analysis?.weakest_topics?.length > 0 ? (
                analysis.weakest_topics.map((t: any) => (
                  <div key={t.topic} className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 dark:text-red-200 font-bold text-sm">{t.topic}</span>
                      <span className="text-red-600 dark:text-red-400 text-sm font-black">{t.accuracy}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-white/50 text-sm font-medium">Great job! No specific weak topics identified.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6 shadow-sm">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-4">Quick Insights</h2>
            <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-white/70 text-sm font-medium leading-relaxed">
              {analysis?.time_outliers?.length > 0 && (
                <li>You spent significantly more time on <span className="font-bold">{analysis.time_outliers.length}</span> questions.</li>
              )}
              {accuracy_percent > 80 && (
                <li>Strong command over the concepts. Keep practicing!</li>
              )}
              {Number(percentile) > 90 && (
                <li className="text-violet-600 dark:text-violet-400 font-black">Elite Performance! Top 10% bracket.</li>
              )}
            </ul>
          </GlassCard>
        </div>

        {/* ── Section Breakdown ──────────────────────────────────────────────── */}
        <GlassCard className="p-6 shadow-sm">
          <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-6">Section-wise Score</h2>
          <div className="space-y-5">
            {Object.values(sectionMap).map((sec) => {
              const pct = sec.total > 0 ? Math.max(0, (sec.earned / sec.total) * 100) : 0;
              return (
                <div key={sec.title}>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-slate-600 dark:text-white/60">{sec.title}</span>
                    <span className="text-slate-900 dark:text-white">
                      {sec.earned.toFixed(0)} / {sec.total.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-[#222222] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* ── Question-by-question ───────────────────────────────────────────── */}
        <div className="pt-4">
          <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-6">Question-wise Review</h2>
          <div className="space-y-4">
            {questions.map((q: any, idx: number) => {
              const isExpanded = expandedIdx === idx;
              const status = q.is_correct === true ? 'correct' : q.is_correct === false ? 'wrong' : 'unattempted';
              const text = q.payload?.text || q.text || 'N/A';
              const correctKey = q.correct_key || q.correct_answer || 'N/A';
              
              const statusStyles = {
                correct: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5',
                wrong: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5',
                unattempted: 'border-slate-200 dark:border-[#222222] bg-white dark:bg-[#111111]',
              }[status];
              const statusBadge = {
                correct: <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-full px-2.5 py-1">✓ Correct</span>,
                wrong: <span className="text-[10px] font-bold uppercase tracking-widest bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-full px-2.5 py-1">✗ Wrong</span>,
                unattempted: <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-[#222222] text-slate-600 dark:text-white/40 border border-slate-300 dark:border-[#333333] rounded-full px-2.5 py-1">— Skipped</span>,
              }[status];

              return (
                <div key={q.id} className={`border rounded-3xl overflow-hidden transition-all duration-300 shadow-sm ${statusStyles}`}>
                  <button
                    id={`question-result-${idx + 1}`}
                    className="w-full flex items-start gap-4 p-5 text-left"
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <span className="text-slate-400 dark:text-white/40 text-sm font-bold font-mono w-6 flex-shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-white/90 text-sm font-medium line-clamp-2 leading-relaxed">{text}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {statusBadge}
                      <span className={`text-sm font-black ${parseFloat(q.marks_awarded) > 0 ? 'text-emerald-600 dark:text-emerald-400' : parseFloat(q.marks_awarded) < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-white/40'}`}>
                        {parseFloat(q.marks_awarded) >= 0 ? '+' : ''}{parseFloat(q.marks_awarded || 0).toFixed(0)}
                      </span>
                      <svg className={`w-5 h-5 text-slate-400 dark:text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-200/50 dark:border-[#222222] pt-5 space-y-4">
                      <p className="text-slate-800 dark:text-white/90 text-sm font-medium leading-relaxed">{text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-slate-200 dark:border-[#1a1a1a]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mb-1.5">Your answer</div>
                          <div className="text-slate-900 dark:text-white font-bold text-sm">{q.student_answer || '(not answered)'}</div>
                        </div>
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-slate-200 dark:border-[#1a1a1a]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 mb-1.5">Correct answer</div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{correctKey}</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 pt-2">
                        ⏱ Time spent: {q.time_spent_seconds || 0}s
                      </div>
                      {q.explanation && (
                        <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-2xl p-4 mt-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-400 mb-2">Explanation</div>
                          <p className="text-slate-700 dark:text-white/80 text-sm font-medium leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
