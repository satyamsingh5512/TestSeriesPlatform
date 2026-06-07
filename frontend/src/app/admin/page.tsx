'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Users, BookOpen, Clock, BarChart3, Plus, Settings2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient().get('/api/admin/stats')
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 md:p-12 space-y-8 animate-pulse max-w-5xl mx-auto">
      <div className="h-8 bg-panel-hover rounded w-1/4 mb-10"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-panel-hover rounded-xl border border-themeBorder"></div>)}
      </div>
      <div className="h-64 bg-panel-hover rounded-xl border border-themeBorder mt-8"></div>
    </div>
  );

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto space-y-10 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-highlight tracking-tight">Admin Overview</h1>
          <p className="text-sm text-muted mt-1">Tenant-wide statistics and rapid controls.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/admin/users')} className="btn bg-panel hover:bg-panel-hover border-themeBorder h-10 px-4">
            <Users className="w-4 h-4 mr-2" /> Manage Users
          </button>
          <button onClick={() => router.push('/admin/exams/create')} className="btn btn-primary h-10 px-6 shadow-glow-hover">
            <Plus className="w-4 h-4 mr-2" /> Create Exam
          </button>
        </div>
      </header>

      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="panel p-6 flex flex-col justify-between hover:border-accent/50 transition-colors group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">Total</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted mb-1">Registered Users</p>
            <p className="text-3xl font-bold font-display text-highlight">{stats?.total_users || 0}</p>
          </div>
        </div>

        <div className="panel p-6 flex flex-col justify-between hover:border-accent/50 transition-colors group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">Published</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted mb-1">Total Exams</p>
            <p className="text-3xl font-bold font-display text-highlight">{stats?.total_exams || 0}</p>
          </div>
        </div>

        <div className="panel p-6 flex flex-col justify-between hover:border-accent/50 transition-colors group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">Live</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted mb-1">Active Attempts</p>
            <p className="text-3xl font-bold font-display text-highlight">{stats?.active_attempts || 0}</p>
          </div>
        </div>

        <div className="panel p-6 flex flex-col justify-between hover:border-accent/50 transition-colors group cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">Avg</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted mb-1">Global Score</p>
            <p className="text-3xl font-bold font-display text-highlight">{Number(stats?.avg_score || 0).toFixed(1)}</p>
          </div>
        </div>

      </motion.div>

      <div className="panel p-8 border-themeBorder flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
           <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Settings2 className="w-6 h-6" />
           </div>
           <div>
             <h3 className="text-xl font-bold font-display text-highlight">Feature Management</h3>
             <p className="text-sm text-muted mt-1">Enable or disable platform modules for your tenant seamlessly.</p>
           </div>
        </div>
        <button onClick={() => router.push('/admin/features')} className="btn bg-highlight text-base hover:text-muted border-none h-11 px-8 rounded-full font-bold shadow-crisp w-full md:w-auto">
          Configure Features
        </button>
      </div>

    </div>
  );
}
