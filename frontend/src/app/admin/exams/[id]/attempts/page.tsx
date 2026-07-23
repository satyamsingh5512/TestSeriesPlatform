'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function ExamAttemptsPage() {
  const { id } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient().get(`/api/admin/exams/${id}/attempts`)
      .then(r => setAttempts(r.data.attempts))
      .catch(err => setError(err.response?.data?.error || 'Failed to load attempts'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-panel-hover rounded w-1/3"></div>
        <div className="h-10 bg-panel-hover rounded w-24"></div>
      </div>
      <div className="h-[400px] bg-panel-hover rounded-xl border border-themeBorder"></div>
    </div>
  );
  if (error) return <div className="flex items-center justify-center p-12 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      <header className="flex justify-between items-center border-b border-themeBorder pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-highlight">Exam Sessions & Proctoring</h1>
          <p className="text-sm text-muted mt-1">Review student sessions and proctoring logs.</p>
        </div>
        <Link href="/admin/exams" className="btn btn-secondary">Back to Exams</Link>
      </header>

      {attempts.length === 0 ? (
        <div className="panel p-12 text-center border-dashed"><p className="text-sm text-muted">No attempts recorded for this exam yet.</p></div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-panel-hover border-b border-themeBorder text-xs uppercase tracking-widest text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Violations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-themeBorder">
              {attempts.map(att => (
                <tr key={att.id} className="hover:bg-panel-hover transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{att.student_name}</p>
                    <p className="text-xs text-muted">{att.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`status-tag ${att.status === 'submitted' ? 'status-success' : 'status-active'}`}>
                      {att.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted font-mono">
                    {att.status === 'submitted' ? att.total_score : '--'}
                  </td>
                  <td className="px-6 py-4">
                    {Number(att.violation_count) > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                        <ShieldAlert className="w-3 h-3" /> {att.violation_count} Flags
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <CheckCircle className="w-3 h-3 text-success" /> Clean
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/proctoring/${att.id}`} className="text-accent hover:underline font-semibold text-xs px-3 py-1.5 rounded-md bg-accent/10">
                      View Logs
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
