'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useProctor } from '@/hooks/useProctor';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { ShieldCheck, Camera, MapPin, Clipboard, AlertTriangle, Menu, X, ArrowRight, ArrowLeft, Languages, Clock, Maximize, Ban } from 'lucide-react';
import { ConsentModal } from '@/components/auth/ConsentModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [warningCount, setWarningCount] = useState(0);
  const [blockedToast, setBlockedToast] = useState<string | null>(null);
  const [needsFullscreen, setNeedsFullscreen] = useState(false);

  const MAX_WARNINGS = 2;
  const blockedToastTimer = useRef<any>(null);

  const attemptIdRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const minivideoRef = useRef<HTMLVideoElement>(null);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  const { stream } = useProctor({ attemptId: attemptIdRef.current, enabled: !loading && !submitted && !isLocked });

  useEffect(() => {
    if (videoRef.current && stream) { videoRef.current.srcObject = stream; if (!permissionsGranted) setPermCheck(p => ({ ...p, camera: true })); }
    if (minivideoRef.current && stream) { minivideoRef.current.srcObject = stream; }
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
        
        const durationSeconds = examData.exam.duration_minutes * 60;
        setTimeLeft(durationSeconds);
        setTotalTime(durationSeconds);
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

  const { disarm } = useAntiCheat({
    attemptId: attemptIdRef.current,
    enabled: permissionsGranted && !loading && !submitted && !isLocked,
    maxWarnings: MAX_WARNINGS,
    onWarning: ({ count, max, message }) => {
      setWarningCount(count);
      setProctorAlert(`Warning ${count} of ${max}: ${message} One more violation will terminate your attempt.`);
    },
    onTerminate: (reason) => {
      setProctorAlert('Attempt terminated: proctoring rules were violated repeatedly.');
      setNeedsFullscreen(false);
      setIsLocked(true);
      handleSubmit(true, reason);
    },
    onBlocked: ({ message }) => {
      setBlockedToast(message);
      if (blockedToastTimer.current) clearTimeout(blockedToastTimer.current);
      blockedToastTimer.current = setTimeout(() => setBlockedToast(null), 2500);
    },
    onFullscreenExit: ({ terminating }) => {
      if (!terminating) setNeedsFullscreen(true);
    },
  });

  const resumeFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setNeedsFullscreen(false);
    } catch {
      /* user must retry via the gate button */
    }
  };

  useEffect(() => {
    if (!permissionsGranted || loading || submitted) return;
    timerRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 1) { handleSubmit(true); return 0; } return t - 1; }); }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, submitted, permissionsGranted]);

  const handleSubmit = async (auto = false, reason: string | null = null) => {
    if (submitted) return;
    if (!auto && !confirm('Confirm execution completion?')) return;
    disarm();
    submittedRef.current = true;
    setSubmitted(true); setIsLocked(true);
    setNeedsFullscreen(false);
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

  const toggleReview = (qId: string) => {
    setMarkedForReview(prev => ({...prev, [qId]: !prev[qId]}));
  };

  if (loading && !initError) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Initializing Environment</p>
    </div>
  );

  if (initError) {
    if (initError === 'CONSENT_REQUIRED') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <ConsentModal isOpen={true} onClose={() => router.push('/dashboard')} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-rose-100 max-w-md w-full text-center shadow-lg">
          <p className="text-rose-600 font-bold mb-6">{initError}</p>
          <button onClick={() => router.push('/dashboard')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-slate-800 transition-colors">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!permissionsGranted) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md w-full text-left">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold font-display text-slate-900">Environment Validation</h1>
        </div>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed font-medium">System requirements: Fullscreen context, Camera active, Geolocation, Clipboard lock.</p>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-8">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Proctoring Rules</p>
          <ul className="text-xs text-rose-600/90 font-medium space-y-1 list-disc list-inside">
            <li>Stay in fullscreen. Switching tabs or windows is recorded.</li>
            <li>Copy, paste, right-click and dev-tools shortcuts are disabled.</li>
            <li>You are allowed {MAX_WARNINGS} warnings — the next violation auto-submits your test.</li>
          </ul>
        </div>
        
        <div className="space-y-4 mb-10">
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-3"><Camera className="w-5 h-5 text-slate-700"/> <span className="text-sm font-bold text-slate-900">Video</span></div>
            {permCheck.camera ? <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Ready</span> : <div className="w-16 h-10 bg-slate-200 rounded-lg overflow-hidden relative"><video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" /></div>}
          </div>
          <button onClick={() => { navigator.geolocation.getCurrentPosition(() => setPermCheck(p => ({...p, location: true}))); }} className="w-full bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200 hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-slate-700"/> <span className="text-sm font-bold text-slate-900">Location</span></div>
            {permCheck.location ? <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Ready</span> : <span className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-md">Allow</span>}
          </button>
          <button onClick={() => { navigator.clipboard.readText().finally(() => setPermCheck(p => ({...p, clipboard: true}))); }} className="w-full bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200 hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-3"><Clipboard className="w-5 h-5 text-slate-700"/> <span className="text-sm font-bold text-slate-900">Clipboard</span></div>
            {permCheck.clipboard ? <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Ready</span> : <span className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-md">Allow</span>}
          </button>
        </div>
        
        <button disabled={!(permCheck.camera && permCheck.location && permCheck.clipboard)} onClick={startExam} className="bg-slate-900 text-white disabled:bg-slate-200 disabled:text-slate-400 w-full py-4 rounded-xl font-bold transition-colors disabled:shadow-none text-base shadow-lg shadow-slate-900/20">
          Initialize Context
        </button>
        {fullscreenError && <p className="text-rose-500 text-sm mt-4 text-center font-bold">Error: Fullscreen permission denied.</p>}
      </div>
    </div>
  );

  const q = questions[currentIdx];
  const h = Math.floor(timeLeft / 3600); const m = Math.floor((timeLeft % 3600) / 60); const s = timeLeft % 60;
  
  // Fake bilingual content if none provided
  const questionText = language === 'EN' ? (q?.payload?.text || q?.text) : (q?.payload?.text_hi || `[Hindi translation not available] ${q?.payload?.text}`);
  const optionsPayload = q?.payload?.options || {};

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 select-none relative font-sans text-slate-900">
      {/* Watermark */}
      {user && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden flex flex-wrap justify-around items-center opacity-[0.03] select-none mix-blend-multiply">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="transform -rotate-45 text-sm font-mono whitespace-nowrap p-8 text-slate-900">
              {user.id} • {user.email}
            </div>
          ))}
        </div>
      )}

      {/* Top Bar (Testbook Inspired) */}
      <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 z-10 relative shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-display font-black text-xl tracking-tight hidden sm:block text-slate-800">Mock Test #402</div>
          <button onClick={() => setLanguage(l => l === 'EN' ? 'HI' : 'EN')} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md font-bold text-xs">
            <Languages className="w-4 h-4" /> {language}
          </button>
        </div>
        
        {/* Timer */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
           <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
           <div className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-rose-600' : 'text-slate-700'}`}>
              {h > 0 ? `${h}h ` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => handleSubmit(false)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-5 py-2 rounded-md text-sm font-bold transition-colors">
            Submit Test
          </button>
        </div>
      </header>
      
      {proctorAlert && (
        <motion.div initial={{y: -100, x: '-50%'}} animate={{y: 20, x: '-50%'}} className="fixed top-0 left-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-full font-bold shadow-xl shadow-rose-600/20 text-sm flex items-center gap-2 border border-rose-700">
          <AlertTriangle className="w-5 h-5"/> {proctorAlert}
        </motion.div>
      )}

      {/* Blocked-action toast (copy / paste / right-click / forbidden key) */}
      <AnimatePresence>
        {blockedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-28 left-1/2 z-[55] bg-slate-900 text-white px-5 py-3 rounded-xl font-bold shadow-2xl text-sm flex items-center gap-2 border border-slate-700"
          >
            <Ban className="w-4 h-4 text-rose-400" /> {blockedToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen re-entry gate — blocks the exam until the student returns to fullscreen */}
      <AnimatePresence>
        {needsFullscreen && !submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">Fullscreen Required</h2>
              <p className="text-sm text-slate-500 font-medium mb-2 leading-relaxed">
                You left fullscreen mode. This has been recorded as a proctoring violation.
              </p>
              <p className="text-sm font-bold text-rose-600 mb-6">
                Warning {warningCount} of {MAX_WARNINGS}. Exceeding the limit will terminate your attempt.
              </p>
              <button
                onClick={resumeFullscreen}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Maximize className="w-5 h-5" /> Return to Fullscreen &amp; Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mini Cam */}
      <div className="fixed bottom-24 right-8 lg:bottom-6 lg:right-[340px] z-50 w-24 h-16 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-white">
        <video ref={minivideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto bg-white p-6 md:p-12 pb-32">
          {q ? (
            <div className={`max-w-3xl mx-auto ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <span className="text-slate-600 text-sm font-bold uppercase">
                  {q.section_title || 'General Intelligence'}
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm font-bold">Question {currentIdx + 1}</span>
              </div>
              
              <div className="text-xl font-medium text-slate-800 leading-relaxed mb-10">
                {questionText}
              </div>
              
              {q.qtype === 'MCQ' && optionsPayload && (
                <div className="space-y-4">
                  {(['A','B','C','D'] as const).map(opt => {
                    const sel = answers[q.id] === opt;
                    const optText = language === 'EN' ? optionsPayload[opt] : (q?.payload?.options_hi?.[opt] || optionsPayload[opt]);
                    return (
                      <button 
                        key={opt} 
                        onClick={() => { if(!isLocked) setAnswers(p => ({...p, [q.id]: opt})) }} 
                        className={cn(
                          "w-full text-left flex gap-4 items-center p-4 rounded-xl border-2 transition-all",
                          sel ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                          sel ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"
                        )}>
                          {opt}
                        </span>
                        <span className={cn("text-base font-medium", sel ? "text-blue-900" : "text-slate-700")}>
                          {optText}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              
              {q.qtype === 'NAT' && (
                <div className="pt-2">
                  <input 
                    type="number" 
                    value={answers[q.id] || ''} 
                    onChange={e => !isLocked && setAnswers(p => ({...p, [q.id]: e.target.value}))} 
                    className="w-full max-w-sm text-2xl font-mono p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="Enter value..." 
                  />
                </div>
              )}
              
              {/* Bottom Action Bar (Distraction Free) */}
              <div className="fixed bottom-0 left-0 right-0 lg:right-[320px] bg-white border-t border-slate-200 p-4 px-6 md:px-12 flex items-center justify-between z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
                <button 
                  onClick={() => currentIdx > 0 && setCurrentIdx(c => c-1)} 
                  disabled={currentIdx === 0 || isLocked} 
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4"/> <span className="hidden sm:inline">Previous</span>
                </button>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => toggleReview(q.id)} 
                    disabled={isLocked} 
                    className={cn(
                      "px-6 py-3 rounded-lg font-bold transition-colors text-sm border",
                      markedForReview[q.id] ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {markedForReview[q.id] ? 'Marked' : 'Mark for Review'}
                  </button>
                  <button 
                    onClick={() => setAnswers(p => { const n={...p}; delete n[q.id]; return n; })} 
                    disabled={isLocked} 
                    className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm hidden sm:block"
                  >
                    Clear Response
                  </button>
                </div>

                <button 
                  onClick={() => currentIdx < questions.length - 1 && setCurrentIdx(c => c+1)} 
                  disabled={currentIdx === questions.length - 1 || isLocked} 
                  className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm shadow-md"
                >
                  <span className="hidden sm:inline">Save & Next</span> <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ) : <div className="text-center mt-32 font-bold text-slate-400 text-lg">You have reached the end of the test.</div>}
        </main>

        {/* Question Palette Sidebar (Testbook Inspired) */}
        <AnimatePresence>
          {(isPaletteOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed lg:absolute right-0 top-0 bottom-0 w-80 bg-slate-50 border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none z-30"
            >
              <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">{user?.name?.[0] || 'U'}</div>
                  <h3 className="text-sm font-bold text-slate-800">Question Palette</h3>
                </div>
                <button onClick={() => setIsPaletteOpen(false)} className="lg:hidden p-1 text-slate-500"><X className="w-5 h-5"/></button>
              </div>

              <div className="p-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 bg-white border-b border-slate-200 shadow-sm mb-4">
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center">1</div> Answered</div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center">2</div> Not Answered</div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">3</div> Marked</div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-amber-500 text-white relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-emerald-500 after:rounded-full flex items-center justify-center">4</div> Ans & Marked</div>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">General Intelligence</h4>
                <div className="grid grid-cols-5 gap-3">
                  {questions.map((qList, i) => {
                    const isAnswered = !!answers[qList.id];
                    const isReview = markedForReview[qList.id];
                    
                    let shapeClass = "rounded"; // square default for un-marked
                    if (isReview) shapeClass = "rounded-full"; // circle for marked
                    
                    let colorClass = "bg-slate-200 text-slate-700"; // unvisited (simplified to not answered for now)
                    if (isAnswered && !isReview) colorClass = "bg-emerald-500 text-white"; // Answered (green square)
                    if (!isAnswered && currentIdx > i) colorClass = "bg-rose-500 text-white"; // Not answered (red square)
                    if (isReview && !isAnswered) colorClass = "bg-amber-500 text-white"; // Marked, unanswered (amber circle)
                    if (isReview && isAnswered) colorClass = "bg-amber-500 text-white relative after:content-[''] after:absolute after:-bottom-0.5 after:-right-0.5 after:w-2.5 after:h-2.5 after:bg-emerald-500 after:rounded-full after:border after:border-white"; // Marked, answered

                    // Override current
                    if (currentIdx === i && !isAnswered && !isReview) colorClass = "bg-white border-2 border-rose-500 text-rose-600";

                    return (
                      <button 
                        key={qList.id} 
                        onClick={() => setCurrentIdx(i)} 
                        className={cn(
                          "w-10 h-10 text-sm font-bold flex items-center justify-center shadow-sm transition-transform active:scale-95",
                          shapeClass,
                          colorClass
                        )}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
