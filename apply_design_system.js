const fs = require('fs');
const path = require('path');

function write(filePath, content) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

// 1. GLOBALS.CSS
write('frontend/src/app/globals.css', `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-base:         #000000;
  --bg-panel:        #0a0a0a;
  --bg-panel-hover:  #141414;
  --bg-glow:         rgba(255, 255, 255, 0.03);

  --text-primary:    #ededed;
  --text-muted:      #888888;
  --text-highlight:  #ffffff;

  --accent:          #ffffff;
  --accent-hover:    #e0e0e0;

  --border:          #222222;
  --border-focus:    #666666;

  --error:           #ff453a;
  --success:         #30d158;
  --warning:         #ffd60a;

  --font-body:       'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:       ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  --radius-sm:       4px;
  --radius-md:       8px;
  --radius-lg:       12px;
}

body.light-theme {
  --bg-base:         #FCF9F2;
  --bg-panel:        #FDFBF7;
  --bg-panel-hover:  #F5EFE6;
  --bg-glow:         rgba(210, 166, 121, 0.1);

  --text-primary:    #3E2F24;
  --text-muted:      #8E7A6B;
  --text-highlight:  #2A1D13;

  --accent:          #D2A679;
  --accent-hover:    #C29668;

  --border:          #EBDCCB;
  --border-focus:    #D2A679;

  --error:           #ff3b30;
  --success:         #28a745;
  --warning:         #e6a817;
}

body {
  background-color: var(--bg-base);
  background-image: radial-gradient(circle at 50% 0%, var(--bg-glow) 0%, transparent 50%);
  background-repeat: no-repeat;
  background-attachment: fixed;
  font-family: var(--font-body);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
}

.panel:hover {
  background: var(--bg-panel-hover);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s;
  border: 1px solid var(--border);
  background: var(--bg-panel);
  color: var(--text-primary);
}

.btn:hover:not(:disabled) {
  background: var(--bg-panel-hover);
}
.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary {
  background: var(--accent);
  color: var(--bg-base);
  border-color: var(--accent);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input, select, textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 1px var(--border-focus);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-highlight);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-panel-hover);
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.status-active { color: var(--bg-base); background: var(--accent); border-color: var(--accent); }
.status-success { color: var(--success); border-color: var(--success); background: transparent; }
.status-error { color: var(--error); border-color: var(--error); background: transparent; }
.status-warning { color: var(--warning); border-color: var(--warning); background: transparent; }

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-focus); }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.6s ease forwards; }

@keyframes floatAndPulse {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
  50% { transform: translateY(-10px) scale(1.04); opacity: 1; }
}
.animate-floatAndPulse { animation: floatAndPulse 3s ease-in-out infinite; }

@keyframes pulseText {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.animate-pulseText { animation: pulseText 2s ease-in-out infinite; }
`);

// 2. TAILWIND CONFIG
write('frontend/tailwind.config.ts', `
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
        'panel-hover': 'var(--bg-panel-hover)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        highlight: 'var(--text-highlight)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        themeBorder: 'var(--border)',
        focus: 'var(--border-focus)',
        error: 'var(--error)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      }
    }
  }
} satisfies Config;
`);

// 3. ROOT LAYOUT + COMMAND PALETTE
write('frontend/src/components/CommandPalette.tsx', `
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-base/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
       <div className="panel w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
         <div className="flex items-center px-4 border-b border-themeBorder">
            <Search className="w-5 h-5 text-muted mr-3" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or type a command..." className="flex-1 bg-transparent border-none shadow-none text-highlight text-lg focus:ring-0 focus:shadow-none py-4" />
         </div>
         <div className="p-2 space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted px-2 py-1 tracking-widest">Quick Actions</div>
            <button onClick={() => { router.push('/dashboard'); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-hover text-primary text-sm transition-colors">Go to Dashboard</button>
            <button onClick={() => { router.push('/admin/exams'); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-hover text-primary text-sm transition-colors">Admin: Manage Exams</button>
            <button onClick={() => { const t = document.body.classList.contains('light-theme') ? 'dark' : 'light'; document.body.classList.toggle('light-theme'); localStorage.setItem('theme', t); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-hover text-primary text-sm transition-colors">Toggle Theme</button>
         </div>
       </div>
    </div>
  );
}
`);

write('frontend/src/app/layout.tsx', `
import type { Metadata } from "next";
import { CommandPalette } from '@/components/CommandPalette';
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamForge",
  description: "High-Stakes Examination Platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{__html: \`
          try {
            if (localStorage.getItem('theme') === 'light') {
              document.body.classList.add('light-theme');
            }
          } catch (e) {}
        \`}} />
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
`);

// 4. STUDENT DASHBOARD
write('frontend/src/app/dashboard/page.tsx', `
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BookOpen, Clock, Award, BarChart3, Zap, ChevronRight, User, LogOut, Calendar, AlertCircle, TrendingUp, BrainCircuit, Target, Bell, CheckCircle2, Moon, Sun } from 'lucide-react';

interface Attempt { id: string; exam_id: string; exam_title: string; status: 'in_progress' | 'submitted' | 'flagged'; total_score: number; percentile: number; started_at: string; }
interface Exam { id: string; title: string; duration_minutes: number; total_marks: number; exam_type: 'fixed' | 'adaptive'; }

function Skeleton({ h = '100px' }: { h?: string }) { return <div className="panel animate-pulseText border-dashed" style={{ height: h }} />; }

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } });
    Promise.allSettled([api.get('/api/auth/me'), api.get('/api/exams'), api.get('/api/attempts/recent'), api.get('/api/attempts/stats')])
      .then(([u, e, a, s]) => {
        if (u.status === 'fulfilled') setUser(u.value.data.user); else throw new Error();
        if (e.status === 'fulfilled') setExams(e.value.data.exams || []);
        if (a.status === 'fulfilled') setAttempts(a.value.data.attempts || []);
        if (s.status === 'fulfilled') setStats(s.value.data.stats || null);
      }).catch(() => router.push('/')).finally(() => setLoading(false));
  }, [router]);

  const activeAttempt = attempts.find(a => a.status === 'in_progress');
  const completedAttempts = attempts.filter(a => a.status === 'submitted');
  const sortedTopics = stats?.latest_analysis ? [...stats.latest_analysis].sort((a: any, b: any) => b.accuracy - a.accuracy) : [];
  const weakestTopic = sortedTopics.length > 0 ? sortedTopics[sortedTopics.length - 1].topic : 'N/A';

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono text-sm animate-pulseText tracking-widest text-muted">Loading Workspace...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen animate-fadeIn">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-themeBorder bg-base p-6 flex flex-col gap-6 sticky top-0 md:h-screen z-20">
        <div className="flex items-center gap-3 text-highlight mb-4">
          <div className="w-8 h-8 flex items-center justify-center rounded bg-highlight text-base"><Zap className="w-4 h-4" /></div>
          <span className="font-semibold tracking-tight text-lg">ExamForge</span>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={\`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors \${activeTab === 'dashboard' ? 'bg-panel text-highlight' : 'text-muted hover:text-primary hover:bg-panel'}\`}><BarChart3 className="w-4 h-4"/> Overview</button>
          <button onClick={() => setActiveTab('exams')} className={\`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors \${activeTab === 'exams' ? 'bg-panel text-highlight' : 'text-muted hover:text-primary hover:bg-panel'}\`}><BookOpen className="w-4 h-4"/> All Exams</button>
          <button onClick={() => setActiveTab('results')} className={\`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors \${activeTab === 'results' ? 'bg-panel text-highlight' : 'text-muted hover:text-primary hover:bg-panel'}\`}><Award className="w-4 h-4"/> Results</button>
        </nav>
        <div className="pt-4 border-t border-themeBorder space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-themeBorder flex items-center justify-center text-xs font-bold text-highlight">{user?.name[0]}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-highlight truncate">{user?.name}</p><p className="text-[10px] text-muted truncate">ID: {user?.id.split('-')[0]}</p></div>
          </div>
          <button onClick={() => { document.body.classList.toggle('light-theme'); localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark'); }} className="w-full btn btn-secondary text-xs justify-start"><Moon className="w-4 h-4"/> Toggle Theme</button>
          <button onClick={() => { localStorage.clear(); router.push('/'); }} className="w-full btn btn-secondary text-xs justify-start text-error border-transparent hover:border-error hover:bg-transparent"><LogOut className="w-4 h-4"/> Sign Out</button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-semibold text-highlight">Workspace</h1>
              <p className="text-sm text-muted mt-1">Press <kbd className="font-mono bg-panel px-1.5 py-0.5 rounded text-primary border border-themeBorder text-xs">⌘ K</kbd> for quick actions.</p>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-fadeIn">
              
              {/* 1. Active Work */}
              <section>
                <h2 className="text-sm font-semibold text-highlight mb-4">Active Work</h2>
                {activeAttempt ? (
                  <div className="panel p-6 border-accent relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="status-tag status-active mb-3"><Clock className="w-3 h-3" /> In Progress</span>
                        <h3 className="text-lg font-semibold text-highlight">{activeAttempt.exam_title}</h3>
                        <p className="text-sm text-muted mt-1">Started {new Date(activeAttempt.started_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => router.push(\`/exam/\${activeAttempt.exam_id}\`)} className="btn btn-primary">Resume Attempt <ChevronRight className="w-4 h-4"/></button>
                    </div>
                  </div>
                ) : (
                  <div className="panel p-8 text-center border-dashed"><p className="text-sm text-muted">No active exam sessions.</p></div>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* 2. Available Exams */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center"><h2 className="text-sm font-semibold text-highlight">Available Exams</h2><button onClick={() => setActiveTab('exams')} className="text-xs text-accent hover:underline">View all</button></div>
                  {exams.length > 0 ? exams.slice(0, 3).map(exam => (
                    <div key={exam.id} className="panel p-4 flex justify-between items-center group cursor-pointer" onClick={() => router.push(\`/exam/\${exam.id}\`)}>
                      <div>
                        <h4 className="text-sm font-medium text-highlight group-hover:underline">{exam.title}</h4>
                        <p className="text-xs text-muted mt-1">{exam.duration_minutes}m • {exam.exam_type}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                    </div>
                  )) : <div className="panel p-6 text-center border-dashed"><p className="text-xs text-muted">No new exams.</p></div>}
                </section>

                {/* 3. Performance & Insights */}
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-highlight">Performance Summary</h2>
                  <div className="panel p-5 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div><p className="text-[10px] text-muted uppercase tracking-widest font-semibold mb-1">Avg Score</p><p className="text-xl font-mono text-highlight">{Number(stats?.avg_score || 0).toFixed(1)}</p></div>
                      <div><p className="text-[10px] text-muted uppercase tracking-widest font-semibold mb-1">Percentile</p><p className="text-xl font-mono text-highlight">{Number(stats?.avg_percentile || 0).toFixed(0)}</p></div>
                      <div><p className="text-[10px] text-muted uppercase tracking-widest font-semibold mb-1">Completed</p><p className="text-xl font-mono text-highlight">{stats?.total_exams || 0}</p></div>
                    </div>
                    {weakestTopic !== 'N/A' && (
                      <div className="pt-4 border-t border-themeBorder">
                        <p className="text-[10px] text-warning uppercase tracking-widest font-semibold mb-1 flex items-center gap-1"><BrainCircuit className="w-3 h-3"/> Priority Focus</p>
                        <p className="text-sm text-primary">Review <strong className="text-highlight">{weakestTopic}</strong> to improve performance.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* 4. History */}
              <section>
                <h2 className="text-sm font-semibold text-highlight mb-4">Completed Results</h2>
                <div className="space-y-3">
                  {completedAttempts.length > 0 ? completedAttempts.slice(0, 3).map(a => (
                    <div key={a.id} className="panel p-4 flex justify-between items-center group cursor-pointer" onClick={() => router.push(\`/result/\${a.id}\`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded border border-themeBorder flex items-center justify-center font-mono text-sm text-highlight">{a.total_score}</div>
                        <div>
                          <h4 className="text-sm font-medium text-highlight group-hover:underline">{a.exam_title}</h4>
                          <p className="text-xs text-muted mt-1">{new Date(a.started_at).toLocaleDateString()} • {Number(a.percentile || 0).toFixed(1)}%ile</p>
                        </div>
                      </div>
                      <button className="btn btn-secondary text-xs">View Report</button>
                    </div>
                  )) : <div className="panel p-6 text-center border-dashed"><p className="text-xs text-muted">No history.</p></div>}
                </div>
              </section>

            </div>
          )}

          {activeTab === 'exams' && (
             <div className="animate-fadeIn space-y-6">
               <h2 className="text-lg font-semibold text-highlight">All Available Exams</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {exams.map(exam => (
                   <div key={exam.id} className="panel p-5 flex flex-col justify-between">
                     <div>
                       <div className="flex justify-between items-start mb-3"><span className="status-tag">{exam.exam_type}</span><span className="text-xs font-medium text-muted">{exam.total_marks} pts</span></div>
                       <h4 className="font-semibold text-highlight mb-1">{exam.title}</h4>
                       <p className="text-xs text-muted mb-6">{exam.duration_minutes} minutes</p>
                     </div>
                     <button onClick={() => router.push(\`/exam/\${exam.id}\`)} className="btn btn-primary w-full justify-center">Start Exam</button>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'results' && (
             <div className="animate-fadeIn space-y-6">
               <h2 className="text-lg font-semibold text-highlight">All Completed Results</h2>
               <div className="space-y-3">
                  {completedAttempts.map(a => (
                    <div key={a.id} className="panel p-4 flex justify-between items-center cursor-pointer hover:border-focus transition-colors" onClick={() => router.push(\`/result/\${a.id}\`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded border border-themeBorder flex items-center justify-center font-mono text-sm text-highlight">{a.total_score}</div>
                        <div>
                          <h4 className="text-sm font-medium text-highlight">{a.exam_title}</h4>
                          <p className="text-xs text-muted mt-1">{new Date(a.started_at).toLocaleDateString()} • {Number(a.percentile || 0).toFixed(1)}%ile</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </div>
                  ))}
               </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
`);

// 5. EXAM ENGINE (Student)
write('frontend/src/app/exam/[id]/page.tsx', `
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useProctor } from '@/hooks/useProctor';
import { ShieldCheck, Camera, MapPin, Clipboard, ArrowRight, AlertTriangle, Clock } from 'lucide-react';

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permCheck, setPermCheck] = useState({ camera: false, location: false, clipboard: false });
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState('fixed');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);

  const attemptIdRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const answersRef = useRef(answers);
  
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const { stream } = useProctor({ attemptId: attemptIdRef.current, enabled: !loading && !submitted && !isLocked });

  useEffect(() => {
    if (videoRef.current && stream) { videoRef.current.srcObject = stream; if (!permissionsGranted) setPermCheck(p => ({ ...p, camera: true })); }
  }, [stream, permissionsGranted, loading]);

  useEffect(() => {
    async function init() {
      try {
        const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } });
        const { data: examData } = await api.get(\`/api/exams/\${id}\`);
        setTimeLeft(examData.exam.duration_minutes * 60);
        setExamType(examData.exam.exam_type || 'fixed');

        const { data: startData } = await api.post(\`/api/exams/\${id}/start\`);
        attemptIdRef.current = startData.attempt_id;
        
        const { data } = await api.get(\`/api/attempts/\${startData.attempt_id}/questions\`);
        setQuestions(data.questions || []);
        
        const saved: Record<string, string> = {};
        Object.entries(data.responses || {}).forEach(([qId, r]: any) => { if (r.answer) saved[qId] = r.answer; });
        setAnswers(saved);
        setLoading(false);
      } catch { router.push('/dashboard'); }
    }
    init();
  }, [id, router]);

  useEffect(() => {
    if (!permissionsGranted || loading || submitted || isLocked) return;
    const handleExit = () => { setProctorAlert('Violation: Fullscreen Exit. Attempt Locked.'); setIsLocked(true); handleSubmit(true, 'fullscreen_exit'); };
    const handleTab = () => { setProctorAlert('Violation: Tab Switch. Attempt Locked.'); setIsLocked(true); handleSubmit(true, 'tab_switch'); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'F12' || (e.altKey && e.key === 'Tab')) e.preventDefault(); };

    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) handleExit(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) handleTab(); });
    document.addEventListener('keydown', onKey);

    return () => { document.removeEventListener('fullscreenchange', handleExit); document.removeEventListener('visibilitychange', handleTab); document.removeEventListener('keydown', onKey); };
  }, [permissionsGranted, loading, submitted, isLocked]);

  useEffect(() => {
    if (!permissionsGranted || loading || submitted) return;
    timerRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 1) { handleSubmit(true); return 0; } return t - 1; }); }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, submitted, permissionsGranted]);

  const handleSubmit = async (auto = false, reason = null) => {
    if (submitted) return;
    if (!auto && !confirm('Submit exam?')) return;
    setSubmitted(true); setIsLocked(true);
    clearInterval(timerRef.current);
    try {
      const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } });
      const payload: Record<string, any> = {};
      Object.entries(answersRef.current).forEach(([qId, answer]) => { payload[qId] = { answer, time_spent_seconds: 0 }; });
      await api.post(\`/api/attempts/\${attemptIdRef.current}/respond\`, { responses: payload });
      await api.post(\`/api/attempts/\${attemptIdRef.current}/submit\`, { reason });
      router.push(\`/result/\${attemptIdRef.current}\`);
    } catch { setTimeout(() => router.push(\`/result/\${attemptIdRef.current}\`), 3000); }
  };

  const startExam = async () => {
    try { await document.documentElement.requestFullscreen(); setTimeout(() => setPermissionsGranted(true), 100); } catch { alert('Fullscreen required.'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulseText tracking-widest text-muted">Preparing Workspace...</div>;

  if (!permissionsGranted) return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fadeIn">
      <div className="panel max-w-md w-full p-8 text-left">
        <h1 className="text-xl font-semibold text-highlight mb-2">System Readiness Check</h1>
        <p className="text-sm text-muted mb-8">Ensure your environment is secure before proceeding.</p>
        <div className="space-y-3 mb-8">
          <div className="panel p-4 flex items-center justify-between border-transparent bg-panel-hover">
            <div className="flex items-center gap-3"><Camera className="w-4 h-4 text-muted"/> <span className="text-sm font-medium">Video Feed</span></div>
            {permCheck.camera ? <span className="status-tag status-success">Ready</span> : <div className="w-16 h-10 bg-base rounded overflow-hidden relative"><video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" /></div>}
          </div>
          <button onClick={() => { navigator.geolocation.getCurrentPosition(() => setPermCheck(p => ({...p, location: true}))); }} className="w-full panel p-4 flex items-center justify-between hover:border-focus">
            <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-muted"/> <span className="text-sm font-medium">Location</span></div>
            {permCheck.location ? <span className="status-tag status-success">Ready</span> : <span className="text-xs font-semibold text-accent">Allow</span>}
          </button>
          <button onClick={() => { navigator.clipboard.readText().finally(() => setPermCheck(p => ({...p, clipboard: true}))); }} className="w-full panel p-4 flex items-center justify-between hover:border-focus">
            <div className="flex items-center gap-3"><Clipboard className="w-4 h-4 text-muted"/> <span className="text-sm font-medium">Clipboard Guard</span></div>
            {permCheck.clipboard ? <span className="status-tag status-success">Ready</span> : <span className="text-xs font-semibold text-accent">Allow</span>}
          </button>
        </div>
        <button disabled={!(permCheck.camera && permCheck.location && permCheck.clipboard)} onClick={startExam} className="btn btn-primary w-full justify-center">Enter Secure Workspace</button>
      </div>
    </div>
  );

  const q = questions[currentIdx];
  const h = Math.floor(timeLeft / 3600); const m = Math.floor((timeLeft % 3600) / 60); const s = timeLeft % 60;
  const tStr = \`\${h > 0 ? h+':' : ''}\${String(m).padStart(2,'0')}:\${String(s).padStart(2,'0')}\`;

  return (
    <div className="flex flex-col min-h-screen animate-fadeIn select-none">
      <header className="flex items-center justify-between px-6 py-4 border-b border-themeBorder bg-base z-10">
        <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent"/><span className="font-semibold text-highlight">ExamForge</span></div>
        <div className={\`font-mono text-lg font-medium \${timeLeft < 300 ? 'text-error animate-pulseText' : 'text-primary'}\`}>{tStr}</div>
        <div className="flex items-center gap-4"><span className="status-tag status-active hidden sm:inline-flex"><span className="w-1.5 h-1.5 rounded-full bg-base animate-pulse"/> Secured</span><button onClick={() => handleSubmit(false)} className="btn btn-primary text-xs">Finish</button></div>
      </header>
      
      {proctorAlert && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-error text-base px-6 py-3 rounded-md font-semibold shadow-lg text-sm">{proctorAlert}</div>}
      <div className="fixed bottom-6 right-6 z-50 panel w-32 h-24 overflow-hidden shadow-lg"><video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" /></div>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {q ? (
            <div className={\`max-w-3xl mx-auto space-y-8 \${isLocked ? 'opacity-50 pointer-events-none' : ''}\`}>
              <div className="flex justify-between items-center border-b border-themeBorder pb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">{q.section_title}</span>
                <span className="text-sm font-medium">Question {currentIdx + 1} of {questions.length}</span>
              </div>
              <div className="text-lg font-medium text-highlight leading-relaxed">{q.payload.text}</div>
              
              {q.qtype === 'MCQ' && q.payload.options && (
                <div className="space-y-3">
                  {(['A','B','C','D'] as const).map(opt => {
                    const sel = answers[q.id] === opt;
                    return (
                      <button key={opt} onClick={() => { if(!isLocked) setAnswers(p => ({...p, [q.id]: opt})) }} className={\`w-full panel p-4 text-left flex gap-4 items-center transition-colors \${sel ? 'border-accent bg-panel-hover' : ''}\`}>
                        <span className={\`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold \${sel ? 'bg-accent text-base' : 'bg-base border border-themeBorder text-muted'}\`}>{opt}</span>
                        <span className="text-sm text-primary">{q.payload.options![opt]}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {q.qtype === 'NAT' && (
                <div className="pt-4"><input type="number" value={answers[q.id] || ''} onChange={e => !isLocked && setAnswers(p => ({...p, [q.id]: e.target.value}))} className="text-xl font-mono max-w-xs" placeholder="Enter numerical value" /></div>
              )}
              
              <div className="flex items-center gap-3 pt-8 border-t border-themeBorder mt-12">
                <button onClick={() => currentIdx > 0 && setCurrentIdx(c => c-1)} disabled={currentIdx === 0 || isLocked} className="btn btn-secondary">Previous</button>
                <button onClick={() => setAnswers(p => { const n={...p}; delete n[q.id]; return n; })} disabled={isLocked} className="btn btn-secondary">Clear</button>
                <button onClick={() => currentIdx < questions.length - 1 && setCurrentIdx(c => c+1)} disabled={currentIdx === questions.length - 1 || isLocked} className="btn btn-primary ml-auto">Next</button>
              </div>
            </div>
          ) : <div className="text-center mt-20"><p className="text-muted">End of questions.</p></div>}
        </main>

        <aside className="w-64 panel border-y-0 border-r-0 rounded-none bg-base p-6 hidden lg:block overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-6">Overview</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qList, i) => (
              <button key={qList.id} onClick={() => setCurrentIdx(i)} className={\`w-8 h-8 rounded border text-xs font-medium \${answers[qList.id] ? 'bg-accent border-accent text-base' : 'bg-panel border-themeBorder text-muted'} \${currentIdx === i ? 'ring-2 ring-focus ring-offset-2 ring-offset-base' : ''}\`}>{i + 1}</button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
`);

// 6. RESULT PAGE
write('frontend/src/app/result/[attemptId]/page.tsx', `
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ChevronLeft, Download } from 'lucide-react';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}\` } }); }

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    apiClient().get(\`/api/attempts/\${attemptId}/result\`).then(r => setResult(r.data)).catch(() => router.push('/dashboard'));
  }, [attemptId, router]);

  if (!result) return <div className="min-h-screen flex items-center justify-center font-mono text-sm animate-pulseText text-muted">Compiling Results...</div>;

  const { total_score, max_score, accuracy_percent, percentile, questions, analysis } = result;

  return (
    <div className="min-h-screen animate-fadeIn pb-20">
      <nav className="p-6 max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="btn btn-secondary text-xs"><ChevronLeft className="w-4 h-4"/> Dashboard</Link>
        <button onClick={() => window.print()} className="btn btn-secondary text-xs"><Download className="w-4 h-4"/> Report</button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 space-y-8">
        <section className="panel p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-6">Final Score</p>
          <div className="text-6xl font-bold text-highlight mb-8">{Number(total_score).toFixed(0)} <span className="text-2xl text-muted font-normal">/ {Number(max_score).toFixed(0)}</span></div>
          <div className="flex justify-center gap-12 pt-8 border-t border-themeBorder">
            <div><p className="text-[10px] uppercase font-bold text-muted mb-1">Accuracy</p><p className="text-2xl font-semibold text-primary">{accuracy_percent}%</p></div>
            {percentile != null && <div><p className="text-[10px] uppercase font-bold text-muted mb-1">Percentile</p><p className="text-2xl font-semibold text-primary">{Number(percentile).toFixed(1)}%</p></div>}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-highlight mb-4">Question Breakdown</h3>
          {questions.map((q: any, i: number) => {
            const isCorrect = q.is_correct === true;
            const isWrong = q.is_correct === false;
            return (
              <div key={q.id} className="panel p-5">
                <div className="flex items-start gap-4">
                  <div className="text-xs font-mono text-muted pt-1">{String(i+1).padStart(2,'0')}</div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-medium text-primary">{q.payload?.text || q.text}</p>
                    <div className="flex gap-6 text-xs">
                      <div><span className="text-muted mr-2">Your Answer:</span><span className={isCorrect ? 'text-success' : isWrong ? 'text-error' : 'text-muted'}>{q.student_answer || 'Skipped'}</span></div>
                      <div><span className="text-muted mr-2">Correct Answer:</span><span className="text-highlight">{q.correct_key || q.correct_answer}</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={\`status-tag \${isCorrect ? 'status-success' : isWrong ? 'status-error' : ''}\`}>{isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Skipped'}</span>
                    <div className="text-[10px] text-muted font-mono mt-2">{q.time_spent_seconds}s</div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  );
}
`);

// 7. ADMIN EXAMS
write('frontend/src/app/admin/exams/page.tsx', `
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { BookOpen, Plus, Settings2 } from 'lucide-react';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } }); }

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
                  <td className="px-6 py-4"><span className={\`status-tag \${ex.status === 'published' ? 'status-success' : ''}\`}>{ex.status}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={\`/admin/proctoring\`} className="text-accent hover:underline text-xs">Logs</Link>
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
`);

// 8. ADMIN BUILDER
write('frontend/src/app/admin/exams/create/page.tsx', `
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } }); }

export default function CreateExamPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'meta'|'content'>('meta');
  const [meta, setMeta] = useState({ title: '', duration_minutes: 180, total_marks: 100, exam_type: 'fixed' });
  const [sections, setSections] = useState<any[]>([{ title: 'Section 1', duration_minutes: '', questions: [{ qtype: 'MCQ', difficulty_tier: 'medium', text: '', options: {A:'', B:'', C:'', D:''}, correct_key: '', marks: 4, negative_marks: -1 }] }]);

  const save = async () => {
    try {
      await apiClient().post('/api/admin/exams', { ...meta, sections });
      router.push('/admin/exams');
    } catch { alert('Save failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-fadeIn space-y-8">
      <header className="flex justify-between items-center border-b border-themeBorder pb-6">
        <h1 className="text-2xl font-semibold text-highlight">Exam Builder</h1>
        <button onClick={save} className="btn btn-primary">Publish Exam</button>
      </header>

      <div className="flex gap-4 border-b border-themeBorder">
        <button onClick={() => setTab('meta')} className={\`pb-3 text-sm font-medium \${tab === 'meta' ? 'text-accent border-b-2 border-accent' : 'text-muted'}\`}>Configuration</button>
        <button onClick={() => setTab('content')} className={\`pb-3 text-sm font-medium \${tab === 'content' ? 'text-accent border-b-2 border-accent' : 'text-muted'}\`}>Content Structure</button>
      </div>

      {tab === 'meta' && (
        <div className="panel p-6 space-y-5">
          <div><label className="block text-xs font-semibold text-muted mb-2">Exam Title</label><input value={meta.title} onChange={e => setMeta({...meta, title: e.target.value})} placeholder="e.g. Midterm 2026" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-semibold text-muted mb-2">Duration (mins)</label><input type="number" value={meta.duration_minutes} onChange={e => setMeta({...meta, duration_minutes: parseInt(e.target.value)})} /></div>
             <div><label className="block text-xs font-semibold text-muted mb-2">Format</label><select value={meta.exam_type} onChange={e => setMeta({...meta, exam_type: e.target.value})}><option value="fixed">Standard</option><option value="adaptive">Adaptive</option></select></div>
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-6">
          {sections.map((s, si) => (
            <div key={si} className="panel p-6">
              <input value={s.title} onChange={e => { const n=[...sections]; n[si].title=e.target.value; setSections(n); }} className="text-lg font-semibold bg-transparent border-none px-0 mb-6 focus:ring-0 focus:shadow-none" />
              <div className="space-y-4">
                {s.questions.map((q: any, qi: number) => (
                  <div key={qi} className="p-4 border border-themeBorder rounded bg-panel-hover">
                    <div className="flex gap-3 mb-3"><select value={q.qtype} onChange={e => { const n=[...sections]; n[si].questions[qi].qtype=e.target.value; setSections(n); }} className="w-auto py-1 text-xs"><option value="MCQ">MCQ</option><option value="NAT">NAT</option></select></div>
                    <textarea placeholder="Question text" value={q.text} onChange={e => { const n=[...sections]; n[si].questions[qi].text=e.target.value; setSections(n); }} className="h-20 mb-3" />
                    {q.qtype === 'MCQ' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {['A','B','C','D'].map(opt => <input key={opt} placeholder={\`Option \${opt}\`} value={q.options[opt]} onChange={e => { const n=[...sections]; n[si].questions[qi].options[opt]=e.target.value; setSections(n); }} className="text-sm" />)}
                      </div>
                    )}
                    <div><input placeholder="Correct Answer Key (e.g. A)" value={q.correct_key} onChange={e => { const n=[...sections]; n[si].questions[qi].correct_key=e.target.value; setSections(n); }} className="text-sm border-accent/50 focus:border-accent" /></div>
                  </div>
                ))}
              </div>
              <button onClick={() => { const n=[...sections]; n[si].questions.push({ qtype: 'MCQ', difficulty_tier: 'medium', text: '', options: {A:'', B:'', C:'', D:''}, correct_key: '', marks: 4, negative_marks: -1 }); setSections(n); }} className="mt-4 text-xs font-semibold text-accent">+ Add Question</button>
            </div>
          ))}
          <button onClick={() => setSections([...sections, { title: 'New Section', duration_minutes: '', questions: [] }])} className="w-full panel py-4 text-sm font-semibold text-muted hover:text-highlight border-dashed">Add Section</button>
        </div>
      )}
    </div>
  );
}
`);

// 9. ADMIN PROCTORING
write('frontend/src/app/admin/proctoring/[attemptId]/page.tsx', `
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` } }); }

export default function ProctoringPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => { apiClient().get(\`/api/admin/attempts/\${attemptId}/violations\`).then(r => setData(r.data)); }, [attemptId]);

  if (!data) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulseText text-muted">Loading Stream...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-fadeIn space-y-8">
      <Link href="/admin/exams" className="text-xs text-muted hover:text-primary transition-colors">← Back to Control</Link>
      
      <header className="panel p-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-highlight">{data.attempt.student_name}</h1>
          <p className="text-sm text-muted mt-1">{data.attempt.exam_title}</p>
        </div>
        <div className="text-right">
          <div className={\`status-tag mb-1 \${data.auto_flagged ? 'status-error' : 'status-success'}\`}>{data.auto_flagged ? 'Auto-Flagged' : 'Normal'}</div>
          <p className="text-xs text-muted font-mono">{data.violations.length} violations</p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-highlight">Event Stream</h2>
        {data.violations.length === 0 ? <p className="text-sm text-muted panel p-6">No events detected.</p> : (
          <div className="border-l border-themeBorder ml-4 pl-6 py-2 space-y-6">
            {data.violations.map((v: any) => (
              <div key={v.id} className="relative panel p-4">
                <div className="absolute -left-[30px] top-6 w-2 h-2 rounded-full bg-warning border border-base" />
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-highlight mb-1">{v.type.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-muted font-mono">{new Date(v.occurred_at).toLocaleTimeString()}</p>
                  </div>
                  <select value={v.status} onChange={() => {}} className="text-xs w-auto py-1 px-2 h-8">
                    <option value="flagged">Flagged</option><option value="cleared">Cleared</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
`);

// 10. AUTH MODALS
write('frontend/src/components/auth/AuthModals.tsx', `
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_TENANT_ID = '2375cd52-f3da-46e2-9e6e-58eddb9c9878';

export function LoginModal({ isOpen, onClose, onSwitch }: any) {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  
  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login\`, form);
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); router.push('/dashboard');
    } catch { alert('Login failed'); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="panel w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-highlight mb-6">Sign In</h2>
            <form onSubmit={submit} className="space-y-4">
              <div><label className="text-xs font-semibold text-muted block mb-1">Email</label><input type="email" required onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="text-xs font-semibold text-muted block mb-1">Password</label><input type="password" required onChange={e => setForm({...form, password: e.target.value})} /></div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5">Continue</button>
            </form>
            <p className="text-xs text-muted mt-6 text-center">New? <button onClick={onSwitch} className="text-accent hover:underline">Create account</button></p>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">✕</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function RegisterModal({ isOpen, onClose, onSwitch }: any) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  
  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/register\`, { ...form, tenant_id: DEFAULT_TENANT_ID });
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); router.push('/dashboard');
    } catch { alert('Registration failed'); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="panel w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-highlight mb-6">Create Account</h2>
            <form onSubmit={submit} className="space-y-4">
              <div><label className="text-xs font-semibold text-muted block mb-1">Name</label><input type="text" required onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="text-xs font-semibold text-muted block mb-1">Email</label><input type="email" required onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="text-xs font-semibold text-muted block mb-1">Password</label><input type="password" required onChange={e => setForm({...form, password: e.target.value})} /></div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5">Join</button>
            </form>
            <p className="text-xs text-muted mt-6 text-center">Member? <button onClick={onSwitch} className="text-accent hover:underline">Sign In</button></p>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">✕</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
`);

console.log('Design system applied perfectly.');
