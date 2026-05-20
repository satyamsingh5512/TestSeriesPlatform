'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
    sectionMap[q.section_title].total += parseFloat(q.marks_correct || 4);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-white/3 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <span className="text-white font-semibold text-lg">ExamForge</span>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* ── Score Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30
                          rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Exam Complete
          </div>
          <div className="text-6xl font-black text-white mb-2">
            {Number(total_score).toFixed(0)}
            <span className="text-2xl text-slate-400 font-normal"> / {Number(max_score).toFixed(0)}</span>
          </div>
          <p className="text-slate-400 text-lg mb-6">Total Score</p>

          <div className="flex justify-center gap-10">
            <div>
              <div className="text-3xl font-bold text-blue-400">{accuracy_percent}%</div>
              <div className="text-slate-500 text-sm mt-1">Accuracy</div>
            </div>
            {percentile != null && (
              <div>
                <div className="text-3xl font-bold text-purple-400">{Number(percentile).toFixed(1)}%</div>
                <div className="text-slate-500 text-sm mt-1">Percentile</div>
              </div>
            )}
          </div>

          {percentile != null && (
            <p className="text-slate-400 text-sm mt-4">
              You scored better than <span className="text-white font-semibold">{Number(percentile).toFixed(1)}%</span> of students
            </p>
          )}
          <div className="flex justify-center gap-4 mt-8">
            <a
              href={`http://localhost:3001/api/attempts/${attemptId}/report.pdf`}
              download
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF Report
            </a>
          </div>
        </div>

        {/* ── IRT Ability Score Banner ────────────────────────────────────── */}
        {irt_theta !== null && irt_theta !== undefined && (
          <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">IRT Ability Score</div>
                <div className="text-white text-2xl font-black">{irt_theta !== null ? irt_theta.toFixed(2) : 'N/A'}</div>
                <p className="text-indigo-200 text-sm mt-1">
                  Your ability score of <strong>{irt_theta?.toFixed(2)}</strong> places you at <strong>{irt_label}</strong>
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            {/* Theta scale bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-indigo-300/60 mb-1">
                <span>-4 (Beginner)</span><span>0 (Average)</span><span>+4 (Expert)</span>
              </div>
              <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500"
                  style={{ width: `${Math.min(100, Math.max(0, ((irt_theta + 4) / 8) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Advanced Analysis — Topic Accuracy ────────────────────────────── */}
        {analysis?.topic_report && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-semibold text-lg mb-6">Topic Performance</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.topic_report}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="topic" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {analysis.topic_report.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.accuracy > 70 ? '#22c55e' : entry.accuracy > 40 ? '#3b82f6' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Weakness Map & Insights ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Focus Areas (Weak Topics)
            </h2>
            <div className="space-y-3">
              {analysis?.weakest_topics?.length > 0 ? (
                analysis.weakest_topics.map((t: any) => (
                  <div key={t.topic} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-red-200 font-medium">{t.topic}</span>
                      <span className="text-red-400 text-sm font-bold">{t.accuracy}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Great job! No specific weak topics identified.</p>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-300 text-sm leading-relaxed">
            <h2 className="text-white font-semibold text-lg mb-4">Quick Insights</h2>
            <ul className="space-y-2 list-disc list-inside">
              {analysis?.time_outliers?.length > 0 && (
                <li>You spent significantly more time on {analysis.time_outliers.length} questions.</li>
              )}
              {accuracy_percent > 80 && (
                <li>Strong command over the concepts. Keep practicing!</li>
              )}
              {Number(percentile) > 90 && (
                <li className="text-purple-400 font-bold italic">Elite Performance! Top 10% bracket.</li>
              )}
            </ul>
          </div>
        </div>

        {/* ── Section Breakdown ──────────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold text-lg mb-4">Section-wise Score</h2>
          <div className="space-y-4">
            {Object.values(sectionMap).map((sec) => {
              const pct = sec.total > 0 ? Math.max(0, (sec.earned / sec.total) * 100) : 0;
              return (
                <div key={sec.title}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300 font-medium">{sec.title}</span>
                    <span className="text-white font-semibold">
                      {sec.earned.toFixed(0)} / {sec.total.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Question-by-question ───────────────────────────────────────────── */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Question-wise Review</h2>
          <div className="space-y-3">
            {questions.map((q: any, idx: number) => {
              const isExpanded = expandedIdx === idx;
              const status = q.is_correct === true ? 'correct' : q.is_correct === false ? 'wrong' : 'unattempted';
              const statusStyles = {
                correct: 'border-green-500/30 bg-green-500/5',
                wrong: 'border-red-500/30 bg-red-500/5',
                unattempted: 'border-slate-600 bg-white/3',
              }[status];
              const statusBadge = {
                correct: <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">✓ Correct</span>,
                wrong: <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">✗ Wrong</span>,
                unattempted: <span className="text-xs bg-slate-700 text-slate-400 border border-slate-600 rounded-full px-2 py-0.5">— Skipped</span>,
              }[status];

              return (
                <div key={q.id} className={`border rounded-xl overflow-hidden transition-all ${statusStyles}`}>
                  <button
                    id={`question-result-${idx + 1}`}
                    className="w-full flex items-start gap-4 p-4 text-left"
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <span className="text-slate-500 text-sm font-mono w-6 flex-shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm line-clamp-2">{q.text}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {statusBadge}
                      <span className={`text-sm font-semibold ${parseFloat(q.marks_awarded) > 0 ? 'text-green-400' : parseFloat(q.marks_awarded) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {parseFloat(q.marks_awarded) >= 0 ? '+' : ''}{parseFloat(q.marks_awarded || 0).toFixed(0)}
                      </span>
                      <svg className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
                      <p className="text-white text-sm">{q.text}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-500 text-xs mb-1">Your answer</div>
                          <div className="text-white font-medium">{q.student_answer || '(not answered)'}</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-500 text-xs mb-1">Correct answer</div>
                          <div className="text-green-400 font-medium">{q.correct_answer}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        ⏱ Time spent: {q.time_spent_seconds || 0}s
                      </div>
                      {q.explanation && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="text-blue-400 text-xs font-semibold mb-1">Explanation</div>
                          <p className="text-slate-300 text-sm">{q.explanation}</p>
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
