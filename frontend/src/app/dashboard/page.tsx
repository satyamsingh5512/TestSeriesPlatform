'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import {
  Users, TrendingUp, Clock, Layers, LogOut, ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { GrowlySidebar } from '@/components/growly/GrowlySidebar';
import { GrowlyHeader } from '@/components/growly/GrowlyHeader';
import { MetricCard } from '@/components/growly/MetricCard';
import { SkillProgressionChart } from '@/components/growly/SkillProgressionChart';
import { DepartmentCompletionChart } from '@/components/growly/DepartmentCompletionChart';
import { SkillMatrix } from '@/components/growly/SkillMatrix';
import { CourseLibrary } from '@/components/growly/CourseLibrary';
import { PlaceholderView } from '@/components/growly/PlaceholderView';

// Sparkline seeds (static demo data)
const SPARKLINES = {
  learners:    [900, 980, 1050, 1100, 1180, 1240],
  completion:  [65, 68, 72, 74, 76, 78],
  hours:       [3100, 3400, 3700, 4000, 4200, 4500],
  paths:       [24, 26, 27, 29, 31, 32],
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

type NavInfo = { title: string; desc: string };

const navTitles: { [key: string]: NavInfo } = {
  paths:     { title: 'Learning Paths',  desc: 'Manage and track custom learning paths for your teams.' },
  library:   { title: 'Course Library',  desc: 'Browse the full catalogue of available courses.' },
  analytics: { title: 'Analytics',       desc: 'Deep-dive into team performance trends and learning velocity.' },
  employees: { title: 'Employees',       desc: 'Manage employee profiles, roles and learning assignments.' },
  settings:  { title: 'Settings',        desc: 'Configure workspace preferences, notifications and integrations.' },
};

function GrowlyDashboardView({ user, stats }: { user: any; stats: any }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Metric Cards Row ────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          label="Total Learners"
          value={stats?.total_learners ?? 1240}
          subtext="Active this month"
          trend="up"
          trendValue="+6.2%"
          icon={Users}
          iconBg="bg-growly-blue-light"
          iconColor="text-growly-blue"
          sparkline={SPARKLINES.learners}
        />
        <MetricCard
          label="Avg. Completion Rate"
          value={`${stats?.avg_completion ?? 78}%`}
          subtext="Across all paths"
          trend="up"
          trendValue="+3.1%"
          icon={TrendingUp}
          iconBg="bg-growly-sage-light"
          iconColor="text-green-700"
          sparkline={SPARKLINES.completion}
        />
        <MetricCard
          label="Total Training Hours"
          value={(stats?.total_hours ?? '4,500').toLocaleString?.() ?? '4,500'}
          subtext="Last 6 months"
          trend="up"
          trendValue="+12.4%"
          icon={Clock}
          iconBg="bg-blue-50"
          iconColor="text-growly-steel"
          sparkline={SPARKLINES.hours}
        />
        <MetricCard
          label="Active Learning Paths"
          value={stats?.active_paths ?? 32}
          subtext="3 added this week"
          trend="up"
          trendValue="+2"
          icon={Layers}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sparkline={SPARKLINES.paths}
        />
      </motion.div>

      {/* ── Main Charts Row ──────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Bar chart – 8 cols */}
        <div className="xl:col-span-8">
          <SkillProgressionChart />
        </div>
        {/* Radial chart – 4 cols */}
        <div className="xl:col-span-4">
          <DepartmentCompletionChart />
        </div>
      </motion.div>

      {/* ── Bottom Row ────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SkillMatrix />
        <CourseLibrary />
      </motion.div>
    </motion.div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const consentCode = searchParams.get('consent_callback');
    const verifyAndLoad = async () => {
      if (consentCode) {
        try {
          await api.post('/api/consent/verify', { code: consentCode, dob: '2010-01-01' });
          router.replace('/dashboard');
        } catch (e) { console.error('Consent verification failed', e); }
      }

      const [u, s] = await Promise.allSettled([
        api.get('/api/auth/me'),
        api.get('/api/attempts/stats'),
      ]);
      if (u.status === 'fulfilled') setUser(u.value.data.user);
      else router.push('/');
      if (s.status === 'fulfilled') setStats(s.value.data.stats ?? null);
    };

    verifyAndLoad().finally(() => setLoading(false));
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-growly-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-growly-blue flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[13px] text-growly-muted font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-growly-bg font-sans flex">
      {/* Sidebar */}
      <GrowlySidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main area: push content right of fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col md:ml-[250px] min-w-0">
        {/* Header */}
        <GrowlyHeader
          userName={user?.name ?? ''}
          onMenuClick={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          {/* Page title row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[22px] font-semibold text-growly-ink leading-tight">
                {activeNav === 'dashboard' ? 'Dashboard Overview' : navTitles[activeNav]?.title}
              </h2>
              <p className="text-[13px] text-growly-muted mt-0.5">
                {activeNav === 'dashboard'
                  ? "Here's what's happening with your teams today."
                  : navTitles[activeNav]?.desc}
              </p>
            </div>

            {activeNav === 'dashboard' && (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => { localStorage.clear(); router.push('/'); }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-growly-muted hover:text-growly-ink border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 transition-all"
                >
                  <LogOut size={14} /> Sign out
                </button>
                <button className="flex items-center gap-1.5 text-[13px] font-semibold bg-growly-blue hover:bg-growly-blue/90 text-white rounded-xl px-4 py-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                  Assign Course <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Section content */}
          <AnimatePresence mode="wait">
            {activeNav === 'dashboard' ? (
              <GrowlyDashboardView key="dashboard" user={user} stats={stats} />
            ) : (
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PlaceholderView
                  title={navTitles[activeNav]?.title ?? activeNav}
                  description={navTitles[activeNav]?.desc}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-growly-bg flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-growly-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
