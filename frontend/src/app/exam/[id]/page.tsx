'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useProctor } from '@/hooks/useProctor';
import { ShieldCheck, Camera, MapPin, Clipboard, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { ConsentModal } from '@/components/auth/ConsentModal';

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permCheck, setPermCheck] = useState({ camera: false, location: false, clipboard: false });
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');
  const [fullscreenError, setFullscreenError] = useState(false);
  const [examType, setExamType] = useState('fixed');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const attemptIdRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  const { stream } = useProctor({ attemptId: attemptIdRef.current, enabled: !loading && !submitted && !isLocked });

  useEffect(() => {
    if (videoRef.current && stream) { videoRef.current.srcObject = stream; if (!permissionsGranted) setPermCheck(p => ({ ...p, camera: true })); }
  }, [stream, permissionsGranted, loading]);

  useEffect(() => {
    async function init() {
      try {
        const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const [{ data: examData }, { data: userData }] = await Promise.all([
          api.get(`/api/exams/${id}`),
          api.get('/api/auth/me').catch(() => ({ data: { user: null } }))
        ]);
        if (userData?.user) setUser(userData.user);
        
        setTimeLeft(examData.exam.duration_minutes * 60);
        setExamType(examData.exam.exam_type || 'fixed');

        const { data: startData } = await api.post(`/api/exams/${id}/start`);
        attemptIdRef.current = startData.attempt_id;
        
        const { data } = await api.get(`/api/attempts/${startData.attempt_id}/questions`);
        setQuestions(data.questions || []);
        
        const saved: Record<string, string> = {};
        Object.entries(data.responses || {}).forEach(([qId, r]: any) => { if (r.answer) saved[qId] = r.answer; });
        setAnswers(saved);
        setLoading(false);
      } catch (err: any) { 
        setInitError(err.response?.data?.error || 'Failed to load exam. Please go back and try again.');
        setLoading(false);
      }
    }
    init();
  }, [id, router]);

  useEffect(() => {
    if (!permissionsGranted || loading || submitted || isLocked) return;
    const handleExit = () => { setProctorAlert('Violation: Fullscreen Exit. Attempt Locked.'); setIsLocked(true); handleSubmit(true, 'fullscreen_exit'); };
    const handleTab = () => { setProctorAlert('Violation: Tab Switch. Attempt Locked.'); setIsLocked(true); handleSubmit(true, 'tab_switch'); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'F12' || (e.altKey && e.key === 'Tab')) e.preventDefault(); };

    const onFullscreenChange = () => { if (!document.fullscreenElement && !submittedRef.current) handleExit(); };
    const onVisibilityChange = () => { if (document.hidden && !submittedRef.current) handleTab(); };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('keydown', onKey);

    return () => { document.removeEventListener('fullscreenchange', onFullscreenChange); document.removeEventListener('visibilitychange', onVisibilityChange); document.removeEventListener('keydown', onKey); };
  }, [permissionsGranted, loading, submitted, isLocked]);

  useEffect(() => {
    if (!permissionsGranted || loading || submitted) return;
    timerRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 1) { handleSubmit(true); return 0; } return t - 1; }); }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, submitted, permissionsGranted]);

  const handleSubmit = async (auto = false, reason: string | null = null) => {
    if (submitted) return;
    if (!auto && !confirm('Submit exam?')) return;
    submittedRef.current = true;
    setSubmitted(true); setIsLocked(true);
    clearInterval(timerRef.current);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (e) {}
    }
    try {
      const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const payload: Record<string, any> = {};
      Object.entries(answersRef.current).forEach(([qId, answer]) => { payload[qId] = { answer, time_spent_seconds: 0 }; });
      await api.post(`/api/attempts/${attemptIdRef.current}/respond`, { responses: payload });
      await api.post(`/api/attempts/${attemptIdRef.current}/submit`, { reason });
      router.push(`/result/${attemptIdRef.current}`);
    } catch { setTimeout(() => router.push(`/result/${attemptIdRef.current}`), 3000); }
  };

  const startExam = async () => {
    setFullscreenError(false);
    try { await document.documentElement.requestFullscreen(); setTimeout(() => setPermissionsGranted(true), 100); } 
    catch { setFullscreenError(true); }
  };

  if (loading && !initError) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulseText tracking-widest text-muted">Preparing Workspace...</div>;
  if (initError) {
    if (initError === 'CONSENT_REQUIRED') {
      return (
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
          <ConsentModal isOpen={true} onClose={() => router.push('/dashboard')} />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-6"><div className="panel max-w-md w-full p-8 text-center"><p className="text-red-500 font-semibold mb-4">{initError}</p><button onClick={() => router.push('/dashboard')} className="btn btn-primary">Back to Dashboard</button></div></div>
    );
  }

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
        {fullscreenError && <p className="text-red-500 text-xs mt-3 text-center">Fullscreen is required to start the exam. Please allow it in your browser settings.</p>}
      </div>
    </div>
  );

  const q = questions[currentIdx];
  const h = Math.floor(timeLeft / 3600); const m = Math.floor((timeLeft % 3600) / 60); const s = timeLeft % 60;
  const tStr = `${h > 0 ? h+':' : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  return (
    <div className="flex flex-col min-h-screen animate-fadeIn select-none relative">
      {user && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden flex flex-wrap justify-around items-center opacity-[0.03] select-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="transform -rotate-45 text-xl font-bold whitespace-nowrap p-8 text-primary">
              {user.name} • {user.email}
            </div>
          ))}
        </div>
      )}
      <header className="flex items-center justify-between px-6 py-4 border-b border-themeBorder bg-base z-10 relative">
        <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent"/><span className="font-semibold text-highlight">ExamForge</span></div>
        <div className={`font-mono text-lg font-medium ${timeLeft < 300 ? 'text-error animate-pulseText' : 'text-primary'}`}>{tStr}</div>
        <div className="flex items-center gap-4"><span className="status-tag status-active hidden sm:inline-flex"><span className="w-1.5 h-1.5 rounded-full bg-base animate-pulse"/> Secured</span><button onClick={() => handleSubmit(false)} className="btn btn-primary text-xs">Finish</button></div>
      </header>
      
      {proctorAlert && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-error text-base px-6 py-3 rounded-md font-semibold shadow-lg text-sm">{proctorAlert}</div>}
      <div className="fixed bottom-6 right-6 z-50 panel w-32 h-24 overflow-hidden shadow-lg"><video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" /></div>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {q ? (
            <div className={`max-w-3xl mx-auto space-y-8 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
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
                      <button key={opt} onClick={() => { if(!isLocked) setAnswers(p => ({...p, [q.id]: opt})) }} className={`w-full panel p-4 text-left flex gap-4 items-center transition-colors ${sel ? 'border-accent bg-panel-hover' : ''}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${sel ? 'bg-accent text-base' : 'bg-base border border-themeBorder text-muted'}`}>{opt}</span>
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
              <button key={qList.id} onClick={() => setCurrentIdx(i)} className={`w-8 h-8 rounded border text-xs font-medium ${answers[qList.id] ? 'bg-accent border-accent text-base' : 'bg-panel border-themeBorder text-muted'} ${currentIdx === i ? 'ring-2 ring-focus ring-offset-2 ring-offset-base' : ''}`}>{i + 1}</button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
