'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function ProctoringPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => { 
    apiClient().get(`/api/admin/attempts/${attemptId}/violations`)
      .then(r => setData(r.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load attempt data.'));
  }, [attemptId]);

  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><div className="panel max-w-md p-8 text-center"><p className="text-red-500 font-semibold mb-4">{error}</p><button onClick={() => router.push('/admin/exams')} className="btn btn-primary">Back to Admin</button></div></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulseText text-muted">Loading Stream...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-fadeIn space-y-8">
      <Link href="/admin/exams" className="text-xs text-muted hover:text-primary transition-colors">← Back to Control</Link>
      
      <header className="panel p-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-highlight">{data.attempt.student_name}</h1>
          <p className="text-sm text-muted mt-1">{data.attempt.exam_title}</p>
        </div>
        <div className="text-right">
          <div className={`status-tag mb-1 ${data.auto_flagged ? 'status-error' : 'status-success'}`}>{data.auto_flagged ? 'Auto-Flagged' : 'Normal'}</div>
          <p className="text-xs text-muted font-mono">{data.violations.length} violations</p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-highlight">Event Stream</h2>
        {data.violations.length === 0 ? <p className="text-sm text-muted panel p-6">No events detected.</p> : (
          <div className="border-l border-themeBorder ml-4 pl-6 py-2 space-y-6">
            {data.violations.map((v: any) => (
              <div key={v.id} className="relative panel p-4">
                <div className="absolute -left-[30px] top-6 w-2 h-2 rounded-full bg-warning border border-base" />
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-highlight mb-1">{v.type.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-muted font-mono">{new Date(v.occurred_at).toLocaleTimeString()}</p>
                  </div>
                  <select value={v.status} onChange={() => {}} className="text-xs w-auto py-1 px-2 h-8">
                    <option value="flagged">Flagged</option><option value="cleared">Cleared</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
