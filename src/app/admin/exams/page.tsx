'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['admin', 'super_admin'].includes(user.role)) { router.push('/dashboard'); return; }
    apiClient().get('/api/admin/exams')
      .then(r => setExams(r.data.exams))
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (exam: any) => {
    await apiClient().patch(`/api/admin/exams/${exam.id}/publish`, { is_published: !exam.is_published });
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_published: !e.is_published } : e));
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-semibold text-lg">ExamForge Admin</span>
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition">← Dashboard</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Exam Management</h1>
          <Link
            href="/admin/exams/create"
            id="create-exam-btn"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
          >
            + Create Exam
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No exams yet. Create your first exam.</div>
        ) : (
          <div className="space-y-3">
            {exams.map(exam => (
              <div key={exam.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-5">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>{exam.duration_minutes} min</span>
                    <span>{exam.total_marks} marks</span>
                    <span>{exam.question_count} questions</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs rounded-full px-3 py-1 border font-medium
                    ${exam.is_published
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                    {exam.is_published ? 'Published' : 'Draft'}
                  </span>
                  <button
                    id={`toggle-publish-${exam.id}`}
                    onClick={() => togglePublish(exam)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                  >
                    {exam.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
