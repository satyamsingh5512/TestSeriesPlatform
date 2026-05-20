'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function api() {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
    api().get('/api/exams')
      .then(r => setExams(r.data.exams))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-white/3 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">ExamForge</span>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <Link href="/admin/exams" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition">
              Admin Panel
            </Link>
          ) : null}
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 text-sm transition" id="logout-btn">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Available Exams</h1>
          <p className="text-slate-400 mt-1">{exams.length} exam{exams.length !== 1 ? 's' : ''} available</p>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">No exams available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/40
                           hover:bg-white/8 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">
                    Live
                  </span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-300 transition">{exam.title}</h3>
                {exam.description && <p className="text-slate-400 text-sm mb-4 line-clamp-2">{exam.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-5">
                  <span>⏱ {exam.duration_minutes} min</span>
                  <span>📊 {exam.total_marks} marks</span>
                </div>
                <Link
                  href={`/exam/${exam.id}`}
                  id={`start-exam-${exam.id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold
                             rounded-xl py-2.5 transition-all duration-200 active:scale-[0.98]"
                >
                  Start Exam
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
