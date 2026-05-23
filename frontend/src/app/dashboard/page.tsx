'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  BookOpen, Clock, Award, BarChart3, Zap, ChevronRight, 
  User, LogOut, Calendar, AlertCircle, TrendingUp, 
  BrainCircuit, Target, Bell, CheckCircle2, BadgeCheck,
  Sun, Moon
} from 'lucide-react';

// --- Types ---
interface UserInfo { id: string; name: string; email: string; role: string; tenant_id: string; created_at: string; }
interface Exam { id: string; title: string; duration_minutes: number; total_marks: number; exam_type: 'fixed' | 'adaptive'; }
interface Attempt { id: string; exam_id: string; exam_title: string; status: 'in_progress' | 'submitted' | 'flagged'; total_score: number; percentile: number; started_at: string; }
interface Stats { total_exams: number; avg_score: number; avg_percentile: number; latest_analysis: any; }

function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${token}` } });
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exams' | 'analytics' | 'schedule' | 'profile'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
  };

  const notifications = [
    { id: 1, text: 'Maths Proficiency Test scheduled for tomorrow.' },
    { id: 2, text: 'New analysis generated for your last attempt.' },
  ];
  const upcomingExams = [
    { id: 'up1', title: 'Advanced Physics', duration_minutes: 120, date: 'Tomorrow, 10:00 AM' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = apiClient();
        const [uRes, eRes, aRes, sRes] = await Promise.allSettled([
          api.get('/api/auth/me'), api.get('/api/exams'), api.get('/api/attempts/recent'), api.get('/api/attempts/stats')
        ]);
        if (uRes.status === 'fulfilled') setUser(uRes.value.data.user); else throw new Error();
        if (eRes.status === 'fulfilled') setExams(eRes.value.data.exams || []);
        if (aRes.status === 'fulfilled') setAttempts(aRes.value.data.attempts || []);
        if (sRes.status === 'fulfilled') setStats(sRes.value.data.stats || null);
      } catch { router.push('/'); } finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => { localStorage.clear(); router.push('/'); };

  const activeAttempt = attempts.find(a => a.status === 'in_progress');
  const completedAttempts = attempts.filter(a => a.status === 'submitted');
  const sortedTopics = stats?.latest_analysis ? [...stats.latest_analysis].sort((a: any, b: any) => b.accuracy - a.accuracy) : [];
  const strongestTopic = sortedTopics.length > 0 ? sortedTopics[0].topic : 'N/A';
  const weakestTopic = sortedTopics.length > 0 ? sortedTopics[sortedTopics.length - 1].topic : 'N/A';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-float-pulse font-bold text-accent tracking-widest uppercase">Loading...</div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen animate-fade-in">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 glass-panel m-4 flex flex-col p-6 sticky top-4 h-[calc(100vh-2rem)] z-20 hidden md:flex">
        <div className="flex items-center gap-3 mb-10 text-highlight">
          <Zap className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold tracking-tight">ExamForge</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<BarChart3 />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<BookOpen />} label="Exams" active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} />
          <NavItem icon={<BrainCircuit />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<Calendar />} label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
        </nav>

        <button onClick={toggleTheme} className="flex items-center gap-3 p-3 text-muted hover:text-highlight transition-colors w-full rounded-md mb-2">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="glass-panel p-4 mb-4 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('profile')}>
          <div className="w-10 h-10 rounded-full bg-panel border border-themeBorder flex items-center justify-center font-bold text-highlight">
            {user?.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-highlight truncate flex items-center gap-1">{user?.name} <BadgeCheck className="w-3 h-3 text-accent" /></h4>
            <p className="text-[10px] text-muted truncate">ID: {user?.id.substring(0,8)}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-error hover:opacity-80 transition-opacity w-full rounded-md font-semibold">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-highlight">Welcome back, {user?.name.split(' ')[0]}</h1>
              <p className="text-muted mt-1">Your exam control center is ready.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="xl:col-span-8 space-y-8">
                {activeAttempt && (
                  <div className="glass-panel p-8" style={{ borderColor: 'var(--accent-primary)' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <span className="badge mb-4 text-accent border-themeBorder" style={{ borderColor: 'var(--accent-primary)' }}>
                          <span className="w-2 h-2 rounded-full bg-accent animate-float-pulse" /> In Progress
                        </span>
                        <h2 className="text-2xl font-bold text-highlight mb-2">{activeAttempt.exam_title}</h2>
                        <p className="text-sm text-muted flex items-center gap-2"><Clock className="w-4 h-4" /> Action required to complete session</p>
                      </div>
                      <button onClick={() => router.push(`/exam/${activeAttempt.exam_id}`)} className="btn-primary">
                        Resume Test
                      </button>
                    </div>
                  </div>
                )}

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-highlight">Available Exams</h3>
                    <button onClick={() => setActiveTab('exams')} className="text-sm text-accent font-semibold hover:underline">View all</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {exams.length > 0 ? exams.slice(0, 4).map(exam => (
                      <div key={exam.id} onClick={() => router.push(`/exam/${exam.id}`)} className="glass-panel p-6 cursor-pointer flex flex-col justify-between h-full">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted">
                              <Target className="w-4 h-4" />
                            </div>
                            <span className="badge">{exam.exam_type}</span>
                          </div>
                          <h4 className="font-bold text-highlight mb-1">{exam.title}</h4>
                          <p className="text-xs text-muted">{exam.duration_minutes} mins • {exam.total_marks} pts</p>
                        </div>
                        <div className="mt-6 text-sm font-semibold text-accent flex items-center gap-1">
                          Start Exam <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )) : (
                      <div className="glass-panel col-span-2 p-12 text-center text-muted">No exams available.</div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-highlight mb-6">Recent History</h3>
                  <div className="space-y-3">
                    {completedAttempts.length > 0 ? completedAttempts.slice(0, 3).map(a => (
                      <div key={a.id} onClick={() => router.push(`/result/${a.id}`)} className="glass-panel p-4 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center font-bold text-accent text-sm">
                            {a.total_score}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-highlight">{a.exam_title}</h4>
                            <p className="text-xs text-muted mt-0.5">{new Date(a.started_at).toLocaleDateString()} • {Number(a.percentile || 0).toFixed(1)}%ile</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    )) : (
                      <div className="glass-panel p-8 text-center text-muted">No history yet.</div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="xl:col-span-4 space-y-8">
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-semibold text-highlight mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Performance</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-panel p-4 text-center">
                      <div className="text-[10px] text-muted uppercase tracking-widest mb-1 font-bold">Avg Score</div>
                      <div className="text-2xl font-bold text-highlight">{Number(stats?.avg_score || 0).toFixed(1)}</div>
                    </div>
                    <div className="glass-panel p-4 text-center">
                      <div className="text-[10px] text-muted uppercase tracking-widest mb-1 font-bold">Tests</div>
                      <div className="text-2xl font-bold text-highlight">{stats?.total_exams || 0}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="glass-panel p-3 text-xs flex justify-between">
                      <span className="text-muted font-semibold">Strongest</span>
                      <span className="text-highlight font-bold truncate w-24 text-right">{strongestTopic}</span>
                    </div>
                    <div className="glass-panel p-3 text-xs flex justify-between">
                      <span className="text-muted font-semibold">Weakest</span>
                      <span className="text-error font-bold truncate w-24 text-right">{weakestTopic}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 cursor-pointer" onClick={() => setActiveTab('analytics')}>
                  <h3 className="text-sm font-semibold text-highlight mb-6 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-accent" /> Insights</h3>
                  <div className="space-y-5">
                    {stats?.latest_analysis ? stats.latest_analysis.slice(0, 2).map((item: any) => (
                      <div key={item.topic}>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                          <span className="text-highlight truncate">{item.topic}</span>
                          <span className="text-error">{item.accuracy}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-base rounded-full overflow-hidden">
                          <div className="h-full bg-error rounded-full" style={{ width: `${item.accuracy}%` }} />
                        </div>
                      </div>
                    )) : <p className="text-xs text-muted">Complete exams to generate insights.</p>}
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h3 className="text-sm font-semibold text-highlight mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Updates</h3>
                  <div className="space-y-4">
                    {notifications.map(n => (
                      <div key={n.id} className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-muted font-medium">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab !== 'dashboard' && (
          <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
            <button onClick={() => setActiveTab('dashboard')} className="text-sm text-muted hover:text-highlight font-semibold mb-8">← Back to Dashboard</button>
            
            {activeTab === 'exams' && (
              <div>
                <h1 className="text-3xl font-bold text-highlight mb-8">All Available Exams</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.map(exam => (
                    <div key={exam.id} className="glass-panel p-6">
                      <div className="flex justify-between items-start mb-6">
                        <span className="badge">{exam.exam_type}</span>
                        <span className="text-xs text-muted font-bold">{exam.total_marks} pts</span>
                      </div>
                      <h4 className="font-bold text-lg mb-1 text-highlight">{exam.title}</h4>
                      <p className="text-xs text-muted mb-6">{exam.duration_minutes} Minutes</p>
                      <button onClick={() => router.push(`/exam/${exam.id}`)} className="btn-secondary w-full">Start Exam</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="glass-panel p-8 max-w-lg mx-auto text-center">
                <div className="w-24 h-24 rounded-full glass-panel flex items-center justify-center text-3xl font-bold text-highlight mx-auto mb-6">
                  {user?.name?.[0]}
                </div>
                <h2 className="text-2xl font-bold text-highlight mb-1">{user?.name}</h2>
                <p className="text-muted text-sm mb-8">{user?.email}</p>
                <div className="space-y-4 text-sm font-medium text-left">
                  <div className="flex justify-between border-b border-themeBorder pb-4"><span className="text-muted">Student ID</span><span className="text-highlight font-mono">{user?.id.split('-')[0]}</span></div>
                  <div className="flex justify-between border-b border-themeBorder pb-4"><span className="text-muted">Status</span><span className="text-accent font-bold">Verified</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass-panel rounded-none border-x-0 border-b-0 flex justify-around p-4 z-[100]">
        <MobileNavItem icon={<BarChart3 />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<BookOpen />} active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} />
        <MobileNavItem icon={<Calendar />} active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
        <MobileNavItem icon={<User />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-panel-hover text-highlight font-bold' : 'text-muted hover:text-highlight hover:bg-panel'}`}>
      {React.cloneElement(icon, { size: 18 })}
      <span>{label}</span>
    </div>
  );
}

function MobileNavItem({ icon, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`p-3 rounded-xl transition-colors ${active ? 'bg-panel-hover text-accent' : 'text-muted'}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
  );
}
