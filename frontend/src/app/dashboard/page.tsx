'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Clock3,
  Play,
  Target,
  Trophy,
} from 'lucide-react';

import { GrowlySidebar } from '@/components/growly/GrowlySidebar';
import { GrowlyHeader } from '@/components/growly/GrowlyHeader';
import { RecommendedExams } from '@/components/growly/RecommendedExams';
import { ProfileSettings } from '@/components/growly/ProfileSettings';

type DashboardNav = 'command' | 'practice' | 'performance' | 'settings';

type Attempt = {
  id: string;
  exam_id: string;
  exam_title: string;
  duration_minutes: number;
  status: 'in_progress' | 'submitted' | 'flagged' | 'cancelled';
  total_score: number | string | null;
  percentile: number | string | null;
  started_at: string;
  submitted_at: string | null;
};

type RecommendedExam = {
  id: string;
  title: string;
  goal: string | null;
  duration_minutes: number;
  total_marks: number;
};

const pageCopy: Record<DashboardNav, { eyebrow: string; title: string; description: string }> = {
  command: {
    eyebrow: 'Command centre',
    title: 'Your preparation, in focus.',
    description: 'Use your latest practice signals to decide what to do next.',
  },
  practice: {
    eyebrow: 'Practice library',
    title: 'Matched practice sets.',
    description: 'Published exams selected against your target and study profile.',
  },
  performance: {
    eyebrow: 'Performance',
    title: 'Attempt ledger.',
    description: 'A clear record of submitted and in-progress practice.',
  },
  settings: {
    eyebrow: 'Profile',
    title: 'Shape your study profile.',
    description: 'Your target and study details improve your exam matches.',
  },
};

const reveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const } },
};

function value(value: number | string | null | undefined, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 1 }) : String(value);
}

function percent(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.min(100, Math.round(numberValue))) : null;
}

function dateLabel(date: string | null) {
  if (!date) return 'Not submitted';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

function studyLabel(user: any) {
  const parts = [user?.study_level && user.study_level.replace(/\b\w/g, (letter: string) => letter.toUpperCase()), user?.course || user?.stream].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Study profile incomplete';
}

function ReadinessDial({ percentile }: { percentile: number | null }) {
  const progress = percentile ?? 0;
  const dashOffset = 226 - (226 * progress) / 100;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center" aria-label={percentile === null ? 'No percentile baseline yet' : `${percentile} percentile baseline`}>
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="#E7B45B"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="226"
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-2xl font-medium tracking-[-0.08em] text-white">{percentile ?? '—'}</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">percentile</span>
      </div>
    </div>
  );
}

function SignalCard({ label, metric, detail, icon: Icon }: { label: string; metric: string; detail: string; icon: React.ElementType }) {
  return (
    <div className="glass-surface rounded-2xl p-4">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7789]">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F5FB] text-[#334FA2]"><Icon size={14} strokeWidth={2.2} /></span>
      </div>
      <p className="font-mono text-2xl font-medium tracking-[-0.06em] text-[#11182D]">{metric}</p>
      <p className="mt-1 text-xs leading-5 text-[#788196]">{detail}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Attempt['status'] }) {
  const copy: Record<Attempt['status'], string> = {
    in_progress: 'In progress',
    submitted: 'Submitted',
    flagged: 'Flagged',
    cancelled: 'Cancelled',
  };
  const colors: Record<Attempt['status'], string> = {
    in_progress: 'bg-[#FFF5E1] text-[#9A6112] ring-[#F5D9A0]',
    submitted: 'bg-[#EAF7F0] text-[#25704A] ring-[#BCE4CD]',
    flagged: 'bg-[#FFF0EE] text-[#B4473D] ring-[#F4C6C1]',
    cancelled: 'bg-[#F2F3F6] text-[#687184] ring-[#E1E3E8]',
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] ring-1 ring-inset ${colors[status]}`}>{copy[status]}</span>;
}

function AttemptRows({ attempts, onOpen }: { attempts: Attempt[]; onOpen: (attempt: Attempt) => void }) {
  if (!attempts.length) {
    return <p className="px-5 py-9 text-center text-sm text-[#788196]">Your completed and in-progress attempts will appear here.</p>;
  }

  return (
    <div className="divide-y divide-[#EAECF1]">
      {attempts.map((attempt) => (
        <button key={attempt.id} onClick={() => onOpen(attempt)} className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/45">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#F3F5FB] text-[#344FA5]"><BookOpenCheck size={16} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[#192136]">{attempt.exam_title || 'Untitled exam'}</span>
            <span className="mt-0.5 block text-xs text-[#788196]">{attempt.status === 'submitted' ? dateLabel(attempt.submitted_at) : `Started ${dateLabel(attempt.started_at)}`}</span>
          </span>
          <span className="hidden text-right sm:block">
            <span className="block font-mono text-sm font-medium text-[#1A2337]">{attempt.status === 'submitted' ? `${value(attempt.total_score)} pts` : 'Resume'}</span>
            <span className="text-[11px] text-[#788196]">{attempt.status === 'submitted' && percent(attempt.percentile) !== null ? `${percent(attempt.percentile)} percentile` : `${attempt.duration_minutes || '—'} min`}</span>
          </span>
          <ChevronRight size={16} className="text-[#A5ADBC] transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
}

function DashboardOverview({ user, stats, attempts, exams, onNavigate, onOpenAttempt }: {
  user: any;
  stats: any;
  attempts: Attempt[];
  exams: RecommendedExam[];
  onNavigate: (view: DashboardNav) => void;
  onOpenAttempt: (attempt: Attempt) => void;
}) {
  const activeAttempt = attempts.find((attempt) => attempt.status === 'in_progress');
  const recentAttempts = attempts.slice(0, 4);
  const percentile = percent(stats?.avg_percentile);
  const target = user?.target_goal || 'Choose your target exam';
  const isProfileComplete = Boolean(user?.target_goal && user?.study_level);
  const nextAction = activeAttempt
    ? { eyebrow: 'Resume your session', title: activeAttempt.exam_title, body: 'Your attempt is still open. Continue from where you stopped.', action: 'Resume attempt', click: () => onOpenAttempt(activeAttempt) }
    : !stats?.total_exams
      ? { eyebrow: 'Build your baseline', title: 'Take your first diagnostic', body: 'A completed attempt creates the performance baseline for this workspace.', action: 'Browse practice', click: () => onNavigate('practice') }
      : !isProfileComplete
        ? { eyebrow: 'Improve your matching', title: 'Complete your profile', body: 'Tell us your target and study stage to refine recommended practice.', action: 'Update profile', click: () => onNavigate('settings') }
        : { eyebrow: 'Keep the momentum', title: 'Choose the next practice set', body: 'Your matches are ranked around the target you selected.', action: 'View matches', click: () => onNavigate('practice') };

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-5">
      <motion.section variants={reveal} className="relative isolate overflow-hidden rounded-3xl bg-[#111A36] px-5 py-6 text-white shadow-[0_20px_45px_rgba(17,26,54,0.16)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full border border-[#E7B45B]/25" />
        <div className="pointer-events-none absolute -right-4 -top-12 h-32 w-32 rounded-full border border-[#E7B45B]/20" />
        <div className="relative grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8D1E8]"><Target size={13} className="text-[#E7B45B]" /> Target dossier</div>
            <h2 className="max-w-xl font-display text-3xl leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl">{target}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#BBC5DC]">{studyLabel(user)}{user?.age ? ` · Age ${user.age}` : ''}</p>
            <button onClick={() => onNavigate(isProfileComplete ? 'practice' : 'settings')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E7B45B] px-4 py-2.5 text-xs font-bold text-[#1B2133] transition-colors hover:bg-[#F0C673] focus:outline-none focus:ring-2 focus:ring-white/70">
              {isProfileComplete ? 'Explore matched practice' : 'Complete your study profile'} <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.11] bg-white/[0.06] p-3 pr-5 backdrop-blur-sm">
            <ReadinessDial percentile={percentile} />
            <div className="max-w-[120px]">
              <p className="text-xs font-semibold text-white">Your baseline</p>
              <p className="mt-1 text-xs leading-5 text-[#BBC5DC]">{percentile === null ? 'Finish an attempt to establish your percentile.' : 'Average percentile across submitted attempts.'}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={reveal} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard label="Attempts" metric={value(stats?.total_exams, '0')} detail="Submitted practice exams" icon={BookOpenCheck} />
        <SignalCard label="Average score" metric={stats?.avg_score == null ? '—' : value(stats.avg_score)} detail="Across submitted attempts" icon={Trophy} />
        <SignalCard label="Percentile" metric={percentile === null ? '—' : `${percentile}`} detail="Average standing so far" icon={BarChart3} />
        <SignalCard label="Open sessions" metric={String(attempts.filter((attempt) => attempt.status === 'in_progress').length)} detail="Attempt ready to resume" icon={Clock3} />
      </motion.section>

      <motion.section variants={reveal} className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="glass-surface overflow-hidden rounded-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-[#EAECF1] px-5 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7789]">Next move</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-[#151D31]">{nextAction.title}</h3>
            </div>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#FFF5E1] text-[#A66C14]"><CircleDot size={17} /></span>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm leading-6 text-[#6D778B]">{nextAction.body}</p>
            <button onClick={nextAction.click} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1C2D63] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#273D83] focus:outline-none focus:ring-2 focus:ring-[#7489CE]">
              {nextAction.action} <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="glass-surface overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-[#EAECF1] px-5 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7789]">Recent activity</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-[#151D31]">Attempt ledger</h3>
            </div>
            <button onClick={() => onNavigate('performance')} className="text-xs font-bold text-[#3452A4] hover:text-[#1C2D63]">View all</button>
          </div>
          <AttemptRows attempts={recentAttempts} onOpen={onOpenAttempt} />
        </div>
      </motion.section>

      <motion.section variants={reveal} className="glass-surface rounded-2xl p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7789]">Matched practice</p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-[#151D31]">Recommended for your target</h3>
          </div>
          <button onClick={() => onNavigate('practice')} className="inline-flex items-center gap-1 text-xs font-bold text-[#3452A4] hover:text-[#1C2D63]">Open library <ChevronRight size={14} /></button>
        </div>
        {exams.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {exams.slice(0, 3).map((exam) => (
              <button key={exam.id} onClick={() => { window.location.assign(`/exam/${exam.id}`); }} className="group rounded-xl border border-white/70 bg-white/35 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/55 hover:shadow-[0_8px_18px_rgba(18,35,79,0.06)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7C8495]">{exam.goal || 'Practice exam'}</span>
                <span className="mt-2 block min-h-10 text-sm font-semibold leading-5 text-[#192136]">{exam.title}</span>
                <span className="mt-3 flex items-center justify-between text-xs text-[#7A8395]"><span>{exam.duration_minutes} min · {exam.total_marks} marks</span><Play size={13} className="text-[#3855A5] transition-transform group-hover:translate-x-0.5" /></span>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-surface-soft rounded-xl border-dashed px-5 py-8 text-center">
            <p className="text-sm font-medium text-[#4F5A70]">No matched exams yet.</p>
            <button onClick={() => onNavigate('settings')} className="mt-2 text-xs font-bold text-[#3452A4] hover:underline">Complete your profile to improve matching</button>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

function PerformanceView({ stats, attempts, onOpenAttempt }: { stats: any; attempts: Attempt[]; onOpenAttempt: (attempt: Attempt) => void }) {
  const submitted = attempts.filter((attempt) => attempt.status === 'submitted');
  const bestPercentile = submitted.reduce<number | null>((best, attempt) => {
    const current = percent(attempt.percentile);
    return current !== null && (best === null || current > best) ? current : best;
  }, null);

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={reveal} className="grid gap-3 sm:grid-cols-3">
        <SignalCard label="Submitted" metric={String(submitted.length)} detail="Completed attempts in your ledger" icon={BookOpenCheck} />
        <SignalCard label="Average score" metric={stats?.avg_score == null ? '—' : value(stats.avg_score)} detail="Across all submitted attempts" icon={Trophy} />
        <SignalCard label="Best percentile" metric={bestPercentile === null ? '—' : String(bestPercentile)} detail="Within your recent attempt list" icon={BarChart3} />
      </motion.div>
      <motion.div variants={reveal} className="glass-surface overflow-hidden rounded-2xl">
        <div className="border-b border-[#EAECF1] px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7789]">Practice record</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-[#151D31]">All recent attempts</h3>
        </div>
        <AttemptRows attempts={attempts} onOpen={onOpenAttempt} />
      </motion.div>
    </motion.div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [exams, setExams] = useState<RecommendedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<DashboardNav>('command');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const load = async () => {
      const consentCode = searchParams.get('consent_callback');
      if (consentCode) {
        try {
          await api.post('/api/consent/verify', { code: consentCode, dob: '2010-01-01' });
          router.replace('/dashboard');
        } catch (error) {
          console.error('Consent verification failed', error);
        }
      }

      const [profile, performance, recent, recommended] = await Promise.allSettled([
        api.get('/api/auth/me'),
        api.get('/api/attempts/stats'),
        api.get('/api/attempts/recent'),
        api.get('/api/exams/recommended'),
      ]);

      if (profile.status === 'fulfilled') setUser(profile.value.data.user);
      else router.push('/');
      if (performance.status === 'fulfilled') setStats(performance.value.data.stats ?? null);
      if (recent.status === 'fulfilled') setAttempts(recent.value.data.attempts ?? []);
      if (recommended.status === 'fulfilled') setExams(recommended.value.data.exams ?? []);
    };

    load().finally(() => setLoading(false));
  }, [router, searchParams]);

  const openAttempt = (attempt: Attempt) => {
    router.push(attempt.status === 'in_progress' ? `/exam/${attempt.exam_id}` : `/result/${attempt.id}`);
  };

  const context = useMemo(() => pageCopy[activeNav], [activeNav]);

  if (loading) {
    return (
      <div className="dashboard-shell min-h-screen px-6 py-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-12 w-48 rounded-xl bg-[#E7EAF2]" />
          <div className="mt-8 h-64 rounded-3xl bg-[#E7EAF2]" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="h-32 rounded-2xl bg-[#E7EAF2]" /><div className="h-32 rounded-2xl bg-[#E7EAF2]" /><div className="h-32 rounded-2xl bg-[#E7EAF2]" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell min-h-screen font-sans text-[#161E31]">
      <GrowlySidebar activeNav={activeNav} setActiveNav={setActiveNav} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="min-w-0 md:ml-[272px]">
        <GrowlyHeader userName={user?.name ?? ''} targetGoal={user?.target_goal ?? ''} onMenuClick={() => setMobileOpen(true)} onProfileClick={() => setActiveNav('settings')} />
        <main className="mx-auto w-full max-w-[1480px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6F788A]">{context.eyebrow}</p>
              <h1 className="mt-2 font-display text-3xl leading-none tracking-[-0.035em] text-[#121A30] sm:text-[2.15rem]">{context.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#717A8D]">{context.description}</p>
            </div>
            {activeNav === 'command' && <p className="hidden items-center gap-2 text-xs font-medium text-[#737C8E] sm:flex"><CalendarDays size={14} /> {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>}
          </div>

          <AnimatePresence mode="wait">
            {activeNav === 'command' && <DashboardOverview key="command" user={user} stats={stats} attempts={attempts} exams={exams} onNavigate={setActiveNav} onOpenAttempt={openAttempt} />}
            {activeNav === 'practice' && <motion.div key="practice" initial="hidden" animate="visible" exit={{ opacity: 0, y: -8 }} variants={reveal}><RecommendedExams /></motion.div>}
            {activeNav === 'performance' && <PerformanceView key="performance" stats={stats} attempts={attempts} onOpenAttempt={openAttempt} />}
            {activeNav === 'settings' && <motion.div key="settings" initial="hidden" animate="visible" exit={{ opacity: 0, y: -8 }} variants={reveal}><ProfileSettings onProfileSaved={setUser} /></motion.div>}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return <Suspense fallback={<div className="dashboard-shell min-h-screen" />}><DashboardContent /></Suspense>;
}
