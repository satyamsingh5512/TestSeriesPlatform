'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Moon,
  MoreHorizontal,
  ShieldCheck,
  Sun,
  UserRoundCheck,
  UsersRound,
  Wifi,
} from 'lucide-react';
import { LoginModal, RegisterModal, ForgotPasswordModal, ResetPasswordModal } from '@/components/auth/AuthModals';
import { useTenant } from '@/components/TenantProvider';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

const easeOut = [0.16, 1, 0.3, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const capabilities = [
  {
    icon: Layers3,
    title: 'Flexible exam creation',
    description: 'Build structured exams with sections, reusable questions, scoring rules, and fixed or adaptive delivery.',
  },
  {
    icon: ClipboardCheck,
    title: 'Reliable exam delivery',
    description: 'Keep candidates focused with timed sessions, continuous response saving, and support for resuming attempts.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity monitoring',
    description: 'Capture focus changes and proctoring events so administrators can review suspicious activity with context.',
  },
  {
    icon: Gauge,
    title: 'Automatic scoring',
    description: 'Evaluate MCQ, multiple-correct, and numerical-answer questions consistently as soon as an attempt is submitted.',
  },
  {
    icon: BrainCircuit,
    title: 'Actionable analysis',
    description: 'Turn scores into topic performance, weak areas, time outliers, answer-change insights, and ability estimates.',
  },
  {
    icon: FileText,
    title: 'Shareable results',
    description: 'Give learners a clear result experience and downloadable reports while admins retain an overview of every attempt.',
  },
];

const faqs = [
  {
    question: 'What types of assessments can I create?',
    answer: 'The platform supports academic and competitive assessments with sections, configurable scoring, and MCQ, multiple-correct, and numerical-answer questions. Exams can use a fixed sequence or adaptive delivery.',
  },
  {
    question: 'What happens if a learner loses connection?',
    answer: 'Responses are saved continuously during an active attempt. The platform is designed to preserve progress and supports resuming eligible attempts instead of forcing learners to start over.',
  },
  {
    question: 'How does exam integrity monitoring work?',
    answer: 'The exam experience records configured integrity events, such as focus changes and other proctoring violations. Administrators can review flagged attempts and their event history.',
  },
  {
    question: 'When are results available?',
    answer: 'Objective questions are scored after submission. Learners can review their result and analysis when processing is complete, and can download a PDF report for their records.',
  },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-blue-500/[0.08] blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_80px_-28px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex h-11 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="text-[10px] font-medium text-slate-400">Performance overview</div>
          <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[148px_1fr]">
          <aside className="min-h-[410px] border-r border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-6 flex items-center gap-2 px-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="hidden text-[11px] font-semibold text-slate-800 sm:block dark:text-slate-100">Workspace</span>
            </div>
            {[
              [BarChart3, 'Overview', true],
              [BookOpenCheck, 'Exams', false],
              [UsersRound, 'Learners', false],
              [FileText, 'Reports', false],
            ].map(([Icon, label, active]) => {
              const ItemIcon = Icon as typeof BarChart3;
              return (
                <div key={label as string} className={`mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-[10px] ${active ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'text-slate-500'}`}>
                  <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:block">{label as string}</span>
                </div>
              );
            })}
          </aside>

          <div className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 text-[10px] text-slate-400">Assessment report</div>
                <div className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">Physics mock test</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Complete
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ['Score', '78 / 100', '+8 from last'],
                ['Percentile', '84th', 'Strong result'],
                ['Time used', '52 min', '8 min remaining'],
              ].map(([label, value, note], index) => (
                <div key={label} className={`${index === 2 ? 'col-span-2 sm:col-span-1' : ''} rounded-xl border border-slate-100 p-3 dark:border-slate-800`}>
                  <div className="text-[9px] text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 sm:text-base dark:text-white">{value}</div>
                  <div className="mt-1 text-[8px] text-slate-400">{note}</div>
                </div>
              ))}
            </div>

            <div className="mb-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">Topic performance</div>
                <div className="text-[8px] text-slate-400">Questions answered</div>
              </div>
              <div className="flex h-24 items-end gap-2 sm:gap-3" aria-label="Bar chart showing topic performance">
                {[44, 65, 52, 83, 70, 92, 74, 88, 62, 79].map((height, index) => (
                  <div key={index} className="flex h-full flex-1 items-end rounded-sm bg-blue-50 dark:bg-blue-950/40">
                    <div className="w-full rounded-sm bg-blue-600" style={{ height: `${height}%`, opacity: 0.55 + index * 0.04 }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-slate-900">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Needs attention</div>
                  <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">Rotational motion</div>
                </div>
              </div>
              <div className="hidden items-center gap-3 rounded-xl bg-slate-50 p-3 sm:flex dark:bg-slate-800/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Ability estimate</div>
                  <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">Above current level</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: easeOut }}
        className="absolute -bottom-5 -right-2 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:flex dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[9px] text-slate-400">Responses saved</div>
          <div className="text-[10px] font-semibold text-slate-800 dark:text-white">Progress is up to date</div>
        </div>
      </motion.div>
    </div>
  );
}

function LandingPageContent() {
  const [modal, setModal] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const brandName = tenant?.name || 'ExamForge';

  useEffect(() => {
    setTheme(document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    const auth = searchParams.get('auth');
    if (auth === 'login' || auth === 'register') setModal(auth);
  }, [searchParams]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-theme', nextTheme === 'dark');
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg-base)] font-sans text-[var(--text-primary)] selection:bg-blue-600 selection:text-white">
      <LoginModal isOpen={modal === 'login'} onClose={() => setModal(null)} onSwitch={() => setModal('register')} onForgotPassword={() => setModal('forgot-password')} />
      <RegisterModal isOpen={modal === 'register'} onClose={() => setModal(null)} onSwitch={() => setModal('login')} />
      <ForgotPasswordModal isOpen={modal === 'forgot-password'} onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} onSwitchToReset={(email: string) => { setResetEmail(email); setModal('reset-password'); }} />
      <ResetPasswordModal isOpen={modal === 'reset-password'} onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} initialEmail={resetEmail} />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${brandName} home`}>
            <AnimatedLogo className="h-7 w-7 text-slate-950 dark:text-white" />
            <span className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">{brandName}</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex dark:text-slate-300">
            <Link href="#platform" className="transition-colors hover:text-slate-950 dark:hover:text-white">Platform</Link>
            <Link href="#workflow" className="transition-colors hover:text-slate-950 dark:hover:text-white">How it works</Link>
            <Link href="#analytics" className="transition-colors hover:text-slate-950 dark:hover:text-white">Analytics</Link>
            <Link href="#security" className="transition-colors hover:text-slate-950 dark:hover:text-white">Security</Link>
            <Link href="#faq" className="transition-colors hover:text-slate-950 dark:hover:text-white">FAQ</Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button onClick={() => setModal('login')} className="hidden px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950 sm:block dark:text-slate-200 dark:hover:text-white">Log in</button>
            <button onClick={() => setModal('register')} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:px-5 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500">Get started</button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_75%_20%,rgba(37,99,235,0.10),transparent_35%),linear-gradient(to_bottom,#f8fafc,transparent)] dark:bg-[radial-gradient(circle_at_75%_20%,rgba(37,99,235,0.16),transparent_35%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:pb-28 lg:pt-28">
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.09 } } }}>
              <motion.div variants={reveal} className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Complete online assessment platform
              </motion.div>
              <motion.h1 variants={reveal} className="max-w-2xl font-sans text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[64px] dark:text-white">
                Run better assessments. Understand every result.
              </motion.h1>
              <motion.p variants={reveal} className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Create, deliver, and analyze secure online exams in one place. Give learners a dependable test experience and give your team the insight to improve outcomes.
              </motion.p>
              <motion.div variants={reveal} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setModal('register')} className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)] transition-all hover:bg-blue-700 hover:shadow-lg">
                  Create your account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <Link href="#workflow" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                  See how it works
                </Link>
              </motion.div>
              <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {['Fixed & adaptive exams', 'Automatic scoring', 'Detailed reports'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" />{item}</span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8, ease: easeOut }}>
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 dark:divide-slate-800">
            {[
              [GraduationCap, 'For learners', 'A focused exam experience with clear progress and results.'],
              [BookOpenCheck, 'For educators', 'Flexible assessment tools without repetitive manual grading.'],
              [UsersRound, 'For administrators', 'One place to manage exams, attempts, and integrity reviews.'],
            ].map(([Icon, title, text]) => {
              const ItemIcon = Icon as typeof GraduationCap;
              return (
                <div key={title as string} className="flex gap-4 py-7 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <ItemIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div><h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-white">{title as string}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text as string}</p></div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">One connected platform</div>
            <h2 className="font-sans text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white">Everything needed to move from question to insight.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">Designed around the full assessment lifecycle, so your team can spend less time coordinating tools and more time improving learning.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-800">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <motion.article key={title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="bg-white p-7 sm:p-8 dark:bg-slate-950">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"><Icon className="h-5 w-5" /></div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="text-center">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Simple by design</div>
              <h2 className="font-sans text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white">From setup to results in three steps.</h2>
            </div>
            <div className="relative mt-14 grid gap-10 lg:grid-cols-3 lg:gap-16">
              <div className="absolute left-[16.66%] right-[16.66%] top-6 hidden border-t border-dashed border-slate-300 lg:block dark:border-slate-700" />
              {[
                ['01', 'Create', 'Organize sections and questions, choose scoring rules, set timing, and publish when the exam is ready.'],
                ['02', 'Deliver', 'Learners take the assessment in a focused experience while answers, timing, and configured integrity events are recorded.'],
                ['03', 'Understand', 'Review automatic scores, topic-level analysis, attempt patterns, and downloadable reports from a single workspace.'],
              ].map(([number, title, text]) => (
                <div key={number} className="relative text-center">
                  <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900">{number}</div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="analytics" className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-24">
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Beyond the final score</div>
            <h2 className="font-sans text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white">See where performance changes—and why.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">A score tells you what happened. ExamForge connects it with topic mastery, time use, answer revisions, and ability analysis so the next action is easier to identify.</p>
            <div className="mt-8 space-y-5">
              {[
                ['Topic-level breakdown', 'Identify strong areas and concepts that need focused practice.'],
                ['Time and answer patterns', 'Spot unusually slow questions and understand the impact of changed answers.'],
                ['Adaptive ability estimate', 'Use IRT-based analysis to add context beyond raw marks.'],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-2xl shadow-slate-900/10 sm:p-7 dark:border-slate-700">
            <div className="mb-7 flex items-center justify-between">
              <div><div className="text-[10px] uppercase tracking-widest text-slate-500">Analysis</div><div className="mt-1 text-sm font-semibold text-white">Topic confidence</div></div>
              <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[9px] text-slate-400">Latest attempt</span>
            </div>
            <div className="space-y-5">
              {[
                ['Mechanics', 86, 'Strong'],
                ['Electromagnetism', 72, 'On track'],
                ['Thermodynamics', 61, 'Review'],
                ['Modern physics', 78, 'On track'],
              ].map(([topic, value, status]) => (
                <div key={topic as string}>
                  <div className="mb-2 flex items-center justify-between text-[11px]"><span className="font-medium text-slate-200">{topic as string}</span><span className="text-slate-500">{status as string}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
              <div className="rounded-xl bg-slate-900 p-4"><Clock3 className="h-4 w-4 text-amber-400" /><div className="mt-3 text-[9px] text-slate-500">Time outlier</div><div className="mt-1 text-xs font-semibold text-white">Question 18</div></div>
              <div className="rounded-xl bg-slate-900 p-4"><BrainCircuit className="h-4 w-4 text-blue-400" /><div className="mt-3 text-[9px] text-slate-500">Recommended focus</div><div className="mt-1 text-xs font-semibold text-white">Thermodynamics</div></div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl gap-px bg-slate-200 lg:grid-cols-2 dark:bg-slate-800">
            <article className="bg-white px-5 py-16 sm:px-12 lg:py-20 dark:bg-slate-950">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><GraduationCap className="h-5 w-5" /></div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Learner experience</div>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Stay focused from first question to final report.</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Clear navigation, visible timing, saved responses, and useful post-exam feedback reduce uncertainty throughout the assessment journey.</p>
              <button onClick={() => setModal('register')} className="mt-7 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">Create learner account <ChevronRight className="h-4 w-4" /></button>
            </article>
            <article className="bg-white px-5 py-16 sm:px-12 lg:py-20 dark:bg-slate-950">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><UserRoundCheck className="h-5 w-5" /></div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Administrator control</div>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Manage the assessment lifecycle in one workspace.</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Create and publish exams, review attempts, inspect flagged activity, and manage access through distinct student and administrator roles.</p>
              <button onClick={() => setModal('login')} className="mt-7 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">Open admin login <ChevronRight className="h-4 w-4" /></button>
            </article>
          </div>
        </section>

        <section id="security" className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Built for responsible testing</div>
              <h2 className="font-sans text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Control, continuity, and review where they matter.</h2>
              <p className="mt-5 text-sm leading-7 text-slate-400">Exam integrity is more than a lock icon. The platform combines role-aware access, durable response handling, and reviewable event records across the exam workflow.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [LockKeyhole, 'Role-based access', 'Separate student, administrator, and super-admin responsibilities.'],
                [Wifi, 'Continuous response sync', 'Capture progress throughout an attempt and support eligible resumptions.'],
                [ShieldCheck, 'Reviewable violations', 'Preserve configured proctoring events for administrator review.'],
                [ClipboardCheck, 'Consistent scoring', 'Apply defined scoring rules to supported objective question types.'],
              ].map(([Icon, title, text]) => {
                const ItemIcon = Icon as typeof LockKeyhole;
                return <div key={title as string} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><ItemIcon className="h-5 w-5 text-blue-400" /><h3 className="mt-5 text-sm font-semibold text-white">{title as string}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{text as string}</p></div>;
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="text-center">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Common questions</div>
            <h2 className="font-sans text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white">What to know before you begin.</h2>
          </div>
          <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {faqs.map(({ question, answer }, index) => (
              <details key={question} className="group py-5" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 marker:hidden dark:text-white">
                  {question}<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-transform group-open:rotate-45 dark:border-slate-700">+</span>
                </summary>
                <p className="max-w-3xl pr-10 pt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-blue-600 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-sans text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Make every assessment easier to run—and easier to learn from.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100">Bring exam creation, dependable delivery, scoring, and useful performance analysis into one connected experience.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => setModal('register')} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">Get started <ArrowRight className="h-4 w-4" /></button>
                <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">Talk to us</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5"><AnimatedLogo className="h-7 w-7 text-slate-950 dark:text-white" /><span className="text-sm font-bold text-slate-950 dark:text-white">{brandName}</span></Link>
              <p className="mt-4 max-w-xs text-xs leading-5 text-slate-500">A connected platform for creating, delivering, and understanding online assessments.</p>
            </div>
            <div><h3 className="text-xs font-semibold text-slate-900 dark:text-white">Platform</h3><ul className="mt-4 space-y-3 text-xs text-slate-500"><li><Link href="#platform" className="hover:text-blue-600">Features</Link></li><li><Link href="#analytics" className="hover:text-blue-600">Analytics</Link></li><li><Link href="#security" className="hover:text-blue-600">Security</Link></li></ul></div>
            <div><h3 className="text-xs font-semibold text-slate-900 dark:text-white">Company</h3><ul className="mt-4 space-y-3 text-xs text-slate-500"><li><Link href="/about" className="hover:text-blue-600">About</Link></li><li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li><li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li></ul></div>
            <div><h3 className="text-xs font-semibold text-slate-900 dark:text-white">Legal</h3><ul className="mt-4 space-y-3 text-xs text-slate-500"><li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li><li><Link href="/terms" className="hover:text-blue-600">Terms</Link></li><li><button onClick={() => setModal('login')} className="hover:text-blue-600">Log in</button></li></ul></div>
          </div>
          <div className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800">© {new Date().getFullYear()} {brandName}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <LandingPageContent />
    </Suspense>
  );
}
