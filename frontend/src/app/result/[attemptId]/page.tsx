'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ChevronLeft, Download } from 'lucide-react';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` } }); }

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    apiClient().get(`/api/attempts/${attemptId}/result`).then(r => setResult(r.data)).catch(() => router.push('/dashboard'));
  }, [attemptId, router]);

  if (!result) return <div className="min-h-screen flex items-center justify-center font-mono text-sm animate-pulseText text-muted">Compiling Results...</div>;

  const { total_score, max_score, accuracy_percent, percentile, questions, analysis } = result;

  return (
    <div className="min-h-screen animate-fadeIn pb-20">
      <nav className="p-6 max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="btn btn-secondary text-xs"><ChevronLeft className="w-4 h-4"/> Dashboard</Link>
        <button onClick={() => window.print()} className="btn btn-secondary text-xs"><Download className="w-4 h-4"/> Report</button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 space-y-8">
        <section className="panel p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-6">Final Score</p>
          <div className="text-6xl font-bold text-highlight mb-8">{Number(total_score).toFixed(0)} <span className="text-2xl text-muted font-normal">/ {Number(max_score).toFixed(0)}</span></div>
          <div className="flex justify-center gap-12 pt-8 border-t border-themeBorder">
            <div><p className="text-[10px] uppercase font-bold text-muted mb-1">Accuracy</p><p className="text-2xl font-semibold text-primary">{accuracy_percent}%</p></div>
            {percentile != null && <div><p className="text-[10px] uppercase font-bold text-muted mb-1">Percentile</p><p className="text-2xl font-semibold text-primary">{Number(percentile).toFixed(1)}%</p></div>}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-highlight mb-4">Question Breakdown</h3>
          {questions.map((q: any, i: number) => {
            const isCorrect = q.is_correct === true;
            const isWrong = q.is_correct === false;
            return (
              <div key={q.id} className="panel p-5">
                <div className="flex items-start gap-4">
                  <div className="text-xs font-mono text-muted pt-1">{String(i+1).padStart(2,'0')}</div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-medium text-primary">{q.payload?.text || q.text}</p>
                    <div className="flex gap-6 text-xs">
                      <div><span className="text-muted mr-2">Your Answer:</span><span className={isCorrect ? 'text-success' : isWrong ? 'text-error' : 'text-muted'}>{q.student_answer || 'Skipped'}</span></div>
                      <div><span className="text-muted mr-2">Correct Answer:</span><span className="text-highlight">{q.correct_key || q.correct_answer}</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`status-tag ${isCorrect ? 'status-success' : isWrong ? 'status-error' : ''}`}>{isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Skipped'}</span>
                    <div className="text-[10px] text-muted font-mono mt-2">{q.time_spent_seconds}s</div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  );
}
