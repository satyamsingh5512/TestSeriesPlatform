'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { BookOpen, Plus, Settings2 } from 'lucide-react';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient().get('/api/admin/exams').then(r => setExams(r.data.exams)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulseText text-muted">Loading System...</div>;

  return (
    <div className="min-h-screen animate-fadeIn max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-highlight">Exam Control</h1>
          <p className="text-sm text-muted mt-1">Manage tests and monitor active sessions.</p>
        </div>
        <Link href="/admin/exams/create" className="btn btn-primary"><Plus className="w-4 h-4"/> New Exam</Link>
      </header>

      {exams.length === 0 ? (
        <div className="panel p-12 text-center border-dashed"><p className="text-sm text-muted">No exams configured.</p></div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-panel-hover border-b border-themeBorder text-xs uppercase tracking-widest text-muted font-semibold">
              <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-themeBorder">
              {exams.map(ex => (
                <tr key={ex.id} className="hover:bg-panel-hover transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{ex.title}</td>
                  <td className="px-6 py-4 text-muted"><span className="status-tag">{ex.exam_type}</span></td>
                  <td className="px-6 py-4"><span className={`status-tag ${ex.status === 'published' ? 'status-success' : ''}`}>{ex.status}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/proctoring`} className="text-accent hover:underline text-xs">Logs</Link>
                    <button className="text-muted hover:text-highlight text-xs ml-4">Edit</button>
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
