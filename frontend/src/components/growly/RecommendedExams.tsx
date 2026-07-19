'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Target, Clock, ArrowRight } from 'lucide-react';

interface RecommendedExam {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  duration_minutes: number;
  total_marks: number;
  exam_type: string;
  match_score: number;
}

export function RecommendedExams() {
  const router = useRouter();
  const [exams, setExams] = useState<RecommendedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    api.get('/api/exams/recommended')
      .then(({ data }) => setExams(data.exams ?? []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load exams.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-growly-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500 bg-red-500/10 p-4 rounded-xl">{error}</div>;
  }

  if (!exams.length) {
    return (
      <div className="text-sm text-growly-muted bg-white border border-gray-100 rounded-xl p-8 text-center">
        No exams available right now. Check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {exams.map((exam) => (
        <div key={exam.id} className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-[15px] font-semibold text-growly-ink">{exam.title}</h3>
            {exam.goal && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-growly-blue bg-growly-blue-light px-2 py-0.5 rounded-full">
                <Target size={12} /> {exam.goal}
              </p>
            )}
          </div>
          {exam.description && (
            <p className="text-[13px] text-growly-muted line-clamp-2">{exam.description}</p>
          )}
          <div className="flex items-center gap-4 text-[12px] text-growly-muted">
            <span className="flex items-center gap-1"><Clock size={13} /> {exam.duration_minutes} mins</span>
            <span>{exam.total_marks} marks</span>
            <span className="capitalize">{exam.exam_type}</span>
          </div>
          <button
            onClick={() => router.push(`/exam/${exam.id}`)}
            className="mt-1 self-start flex items-center gap-1.5 text-[13px] font-semibold bg-growly-blue hover:bg-growly-blue/90 text-white rounded-xl px-4 py-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Start Exam <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
