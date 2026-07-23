'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowUpRight, Clock3, Play, Sparkles, Target } from 'lucide-react';

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
      .catch((requestError) => setError(requestError.response?.data?.error || 'We could not load matched practice right now.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-[#E6E9F0] bg-white" />)}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-[#F0C7C2] bg-[#FFF5F3] px-5 py-4 text-sm text-[#A2443B]">{error}</div>;
  }

  if (!exams.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D8DEE9] bg-white px-6 py-14 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F6FB] text-[#3855A5]"><Target size={19} /></span>
        <h3 className="mt-4 text-base font-semibold text-[#182136]">No matched practice yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#727C91]">Update your target exam and study profile, then return here for more relevant practice.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#3452A4] hover:text-[#1C2D63]">Go to your command centre <ArrowUpRight size={13} /></button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {exams.map((exam, index) => (
        <article key={exam.id} className="group flex min-h-[240px] flex-col rounded-2xl border border-[#E3E7EF] bg-white p-5 shadow-[0_1px_1px_rgba(15,23,42,.02)] transition-all duration-200 hover:-translate-y-1 hover:border-[#C5D0EC] hover:shadow-[0_14px_28px_rgba(22,37,80,.09)]">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F5FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3855A5]"><Sparkles size={11} /> {index < 3 ? 'Strong match' : 'Recommended'}</span>
            <span className="rounded-lg bg-[#F8F9FC] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[#778196]">{exam.exam_type}</span>
          </div>
          <div className="mt-5">
            {exam.goal && <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#9A6112]"><Target size={12} /> {exam.goal}</p>}
            <h3 className="text-lg font-semibold leading-6 tracking-[-0.025em] text-[#172036]">{exam.title}</h3>
            {exam.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#6F798D]">{exam.description}</p>}
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#EDF0F4] pt-4">
            <span className="flex items-center gap-1.5 text-xs text-[#778196]"><Clock3 size={13} /> {exam.duration_minutes} min <span className="text-[#D0D5DF]">/</span> {exam.total_marks} marks</span>
            <button onClick={() => router.push(`/exam/${exam.id}`)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C2D63] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2A438E] focus:outline-none focus:ring-2 focus:ring-[#9EB0E4]">Start <Play size={12} fill="currentColor" /></button>
          </div>
        </article>
      ))}
    </div>
  );
}
