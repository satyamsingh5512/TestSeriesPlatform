'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useProctor } from '@/hooks/useProctor';
import { ShieldCheck, Camera, MapPin, Clipboard, ArrowRight, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Manrope } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ─── Types ────────────────────────────────────────────────────────────────────
type QuestionType = 'MCQ' | 'NAT' | 'MULTI_CORRECT' | 'SUBJECTIVE';
interface Question {
  id: string;
  qtype: QuestionType;
  payload: {
    text: string;
    options?: { A: string; B: string; C: string; D: string };
    images?: string[];
    latex?: string;
  };
  marks: number;
  negative_marks: number;
  sequence: number;
  section_id: string;
  section_title: string;
  section_duration?: number | null;
}
type PaletteStatus = 'unvisited' | 'unanswered' | 'answered' | 'review';

// ─── API helper ───────────────────────────────────────────────────────────────
function apiClient() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Reusable Glass Panel ---
const GlassCard = ({ children, className = '', hover = false, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-3xl  overflow-hidden ${hover ? 'hover:bg-white dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] cursor-pointer transition-all duration-500' : ''} ${className}`}
  >
    {children}
  </div>
);

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permCheck, setPermCheck] = useState({
    camera: false,
    location: false,
    clipboard: false,
  });
  
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examType, setExamType] = useState<'fixed' | 'adaptive'>('fixed');
  const [adaptiveQNum, setAdaptiveQNum] = useState(1);
  const [loadingNext, setLoadingNext] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedReview, setMarkedReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [examDuration, setExamDuration] = useState(180);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [answerChanges, setAnswerChanges] = useState<Record<string, number>>({});
  const [firstAnswers, setFirstAnswers] = useState<Record<string, string>>({});
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

  // ── Proctoring ─────────────────────────────────────────────────────────────
  const { stream } = useProctor({
    attemptId,
    enabled: !loading && !submitted && !isLocked,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (!permissionsGranted) setPermCheck(p => ({ ...p, camera: true }));
    }
  }, [stream, permissionsGranted, loading]);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const violationBatchRef = useRef<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const timeSpentRef = useRef<Record<string, number>>({});
  const answerChangesRef = useRef<Record<string, number>>({});
  const firstAnswersRef = useRef<Record<string, string>>({});

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeSpentRef.current = timeSpent; }, [timeSpent]);
  useEffect(() => { answerChangesRef.current = answerChanges; }, [answerChanges]);
  useEffect(() => { firstAnswersRef.current = firstAnswers; }, [firstAnswers]);

  // ── Load Exam ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadExam() {
      try {
        const api = apiClient();
        const { data: examData } = await api.get(`/api/exams/${id}`);
        const type = examData.exam.exam_type || 'fixed';
        const dur = examData.exam.duration_minutes * 60;
        setExamType(type);
        setExamDuration(dur);
        setTimeLeft(dur);

        const { data: startData } = await api.post(`/api/exams/${id}/start`);
        const aId = startData.attempt_id;
        setAttemptId(aId);
        attemptIdRef.current = aId;

        const { data } = await api.get(`/api/attempts/${aId}/questions`);
        
        const savedAnswers: Record<string, string> = {};
        const savedTime: Record<string, number> = {};
        const savedChanges: Record<string, number> = {};
        const savedFirst: Record<string, string> = {};

        Object.entries(data.responses || {}).forEach(([qId, r]: any) => {
          if (r.answer) savedAnswers[qId] = r.answer;
          if (r.time_spent_seconds) savedTime[qId] = r.time_spent_seconds;
          if (r.answer_changes) savedChanges[qId] = r.answer_changes;
          if (r.first_answer) savedFirst[qId] = r.first_answer;
        });

        setAnswers(savedAnswers);
        setTimeSpent(savedTime);
        setAnswerChanges(savedChanges);
        setFirstAnswers(savedFirst);

        if (type === 'adaptive') {
          const nextReq = await api.get(`/api/attempts/${aId}/next-question`);
          if (nextReq.data.question) {
            setQuestions([nextReq.data.question]);
            setCurrentIdx(0);
            setAdaptiveQNum(nextReq.data.current_question_number || 1);
          } else {
            setQuestions([]);
          }
        } else {
          setQuestions(data.questions);
        }

        setLoading(false);
      } catch {
        router.push('/dashboard');
      }
    }
    loadExam();
  }, [id, router]);

  // ── Fullscreen Enforcement & Layered Security ────────────────────────────────────────────────
  useEffect(() => {
    if (!permissionsGranted || loading || submitted || isLocked) return;

    const onVisibility = () => { 
      if (document.hidden && !submitted && !autoSubmitTriggered) {
        setProctorAlert('🚨 Tab switch detected. Exam terminated.');
        handleAutoSubmit('tab_switch');
      }
    };
    const onFullscreenChange = () => { 
      if (!document.fullscreenElement && !submitted && !autoSubmitTriggered) {
        setProctorAlert('🚨 Fullscreen exit detected. Auto-submitting...');
        handleAutoSubmit('fullscreen_exit');
      }
    };
    const onKeydown = (e: KeyboardEvent) => {
      const blockedKeys = ['f12', 'i', 'j', 'c', 'v', 'x', 'u', 'p', 's'];
      const isCmd = e.ctrlKey || e.metaKey;
      
      if (
        (isCmd && blockedKeys.includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        logViolation('UNAUTHORIZED_KEY', { key: e.key });
      }
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleUnload = () => {
      if (!submitted && !autoSubmitTriggered) {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attempts/${attemptIdRef.current}/submit`;
        const data = JSON.stringify({ reason: 'page_exit' });
        navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
      }
    };

    window.addEventListener('blur', () => {
      if (!submitted && !autoSubmitTriggered) {
        logViolation('WINDOW_FOCUS_LOSS', { timestamp: new Date().toISOString() });
      }
    });

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    const heartbeat = setInterval(async () => {
      if (permissionsGranted && !document.fullscreenElement && !submitted && !autoSubmitTriggered) {
        handleAutoSubmit('fullscreen_heartbeat');
      }
      if (permissionsGranted && !submitted && attemptIdRef.current) {
        try {
          const { data } = await apiClient().get(`/api/attempts/${attemptIdRef.current}/questions`);
          if (data.attempt?.status === 'submitted') {
             setSubmitted(true);
             setIsLocked(true);
             router.push(`/result/${attemptIdRef.current}`);
          }
        } catch (err: any) {
           if (err.response?.status === 403) {
             setSubmitted(true);
             setIsLocked(true);
           }
        }
      }
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      clearInterval(heartbeat);
    };
  }, [permissionsGranted, loading, submitted, isLocked, autoSubmitTriggered, router]);

  const handleAutoSubmit = async (reason: string) => {
    if (autoSubmitTriggered || submitted) return;
    setAutoSubmitTriggered(true);
    setIsLocked(true);
    await handleSubmit(true, reason);
  };

  // ── Permission Requests ────────────────────────────────────────────────────
  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setPermCheck(p => ({ ...p, location: true })),
      () => alert('Location access is mandatory for this exam.'),
      { enableHighAccuracy: true }
    );
  };

  const requestClipboard = async () => {
    try {
      await navigator.clipboard.readText();
      setPermCheck(p => ({ ...p, clipboard: true }));
    } catch {
      setPermCheck(p => ({ ...p, clipboard: true }));
    }
  };

  const handleStartExam = async () => {
    if (permCheck.camera && permCheck.location && permCheck.clipboard) {
      try {
        await document.documentElement.requestFullscreen();
        setTimeout(() => {
          if (document.fullscreenElement) {
            setPermissionsGranted(true);
          } else {
            alert('Failed to enter fullscreen. Please try again.');
          }
        }, 100);
      } catch (err) {
        alert('Fullscreen permission is required to start the exam.');
      }
    }
  };

  // ── Section Timer Logic ───────────────────────────────────────
  useEffect(() => {
    if (!permissionsGranted || examType === 'adaptive' || !questions.length || submitted) return;
    const currentQ = questions[currentIdx];
    if (!currentQ?.section_duration) return;

    const sectionQuestions = questions.filter(q => q.section_id === currentQ.section_id);
    const totalSpent = sectionQuestions.reduce((acc, q) => acc + (timeSpent[q.id] || 0), 0);

    if (totalSpent >= currentQ.section_duration * 60) {
      setLockedSections(prev => new Set(prev).add(currentQ.section_id));
      const nextIdx = questions.findIndex((q, i) => i > currentIdx && q.section_id !== currentQ.section_id);
      if (nextIdx !== -1) setCurrentIdx(nextIdx);
    }
  }, [timeSpent, currentIdx, questions, submitted, examType, permissionsGranted]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!permissionsGranted || loading || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, submitted, permissionsGranted]);

  // ── Batch Sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (!permissionsGranted || loading || submitted) return;
    syncIntervalRef.current = setInterval(() => syncAnswers(), 15000);
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
  }, [loading, submitted, permissionsGranted]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const lastViolationTime = useRef<number>(0);
  function logViolation(type: string, details: any) {
    const now = Date.now();
    if (now - lastViolationTime.current < 2000) return;
    lastViolationTime.current = now;

    violationBatchRef.current.push({ type, details, occurred_at: new Date().toISOString() });
    if (violationBatchRef.current.length >= 5) flushViolations();
  }

  async function flushViolations() {
    if (!attemptIdRef.current || !violationBatchRef.current.length) return;
    const batch = violationBatchRef.current.splice(0);
    try {
      await apiClient().post(`/api/attempts/${attemptIdRef.current}/violations`, { violations: batch });
    } catch { }
  }

  async function syncAnswers() {
    if (!attemptIdRef.current) return;
    recordTimeOnCurrentQuestion();
    const payload: Record<string, any> = {};
    Object.entries(answersRef.current).forEach(([qId, answer]) => {
      payload[qId] = {
        answer,
        time_spent_seconds: timeSpentRef.current[qId] ?? 0,
        answer_changes: answerChangesRef.current[qId] ?? 0,
        first_answer: firstAnswersRef.current[qId] ?? null
      };
    });
    if (!Object.keys(payload).length) return;
    try {
      await apiClient().post(`/api/attempts/${attemptIdRef.current}/respond`, { responses: payload });
    } catch { }
  }

  function recordTimeOnCurrentQuestion() {
    const q = questions[currentIdx];
    if (!q) return;
    const spent = Math.floor((Date.now() - questionStartTime) / 1000);
    setTimeSpent(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + spent }));
    setQuestionStartTime(Date.now());
  }

  function navigateTo(idx: number) {
    if (examType === 'adaptive') return;
    recordTimeOnCurrentQuestion();
    const q = questions[idx];
    if (q) setVisited(v => new Set(v).add(q.id));
    setCurrentIdx(idx);
    setQuestionStartTime(Date.now());
  }

  async function handleNextAdaptive() {
    if (!attemptIdRef.current) return;
    setLoadingNext(true);
    await syncAnswers();
    try {
      const { data } = await apiClient().get(`/api/attempts/${attemptIdRef.current}/next-question`);
      if (data.question) {
        setQuestions([data.question]);
        setCurrentIdx(0);
        setAdaptiveQNum(data.current_question_number);
        setQuestionStartTime(Date.now());
      } else {
        await handleSubmit(true);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingNext(false);
  }

  function handleAnswer(answer: string) {
    const q = questions[currentIdx];
    if (!q || lockedSections.has(q.section_id)) return;
    if (answers[q.id] !== answer) {
      setAnswerChanges(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
      if (!firstAnswers[q.id]) setFirstAnswers(prev => ({ ...prev, [q.id]: answer }));
    }
    setAnswers(prev => ({ ...prev, [q.id]: answer }));
    setVisited(v => new Set(v).add(q.id));
  }

  function handleMultiAnswer(opt: string) {
    const q = questions[currentIdx];
    if (!q || lockedSections.has(q.section_id)) return;
    const current = (answers[q.id] || '').split(',').filter(Boolean);
    const idx = current.indexOf(opt);
    if (idx >= 0) current.splice(idx, 1); else current.push(opt);
    const newAnswer = current.join(',');
    if (answers[q.id] !== newAnswer) {
      setAnswerChanges(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
      if (!firstAnswers[q.id]) setFirstAnswers(prev => ({ ...prev, [q.id]: newAnswer }));
    }
    setAnswers(prev => ({ ...prev, [q.id]: newAnswer }));
    setVisited(v => new Set(v).add(q.id));
  }

  function toggleMarkReview() {
    const q = questions[currentIdx];
    if (!q) return;
    setMarkedReview(prev => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id); else next.add(q.id);
      return next;
    });
  }

  async function handleSubmit(auto = false, reason: string | null = null) {
    if (submitted) return;
    if (!auto && !confirm('Are you sure you want to submit the exam?')) return;
    
    setSubmitted(true);
    setIsLocked(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    
    const currentAttemptId = attemptIdRef.current || attemptId;
    if (!currentAttemptId) {
      setProctorAlert('Critical error: Attempt session not found. Please contact support.');
      return;
    }

    try {
      await syncAnswers();
      await flushViolations();
    } catch (e) {
      console.warn('[Exam] Final sync failed, proceeding to submit anyway');
    }

    const api = apiClient();
    const submitUrl = `/api/attempts/${currentAttemptId}/submit`;

    try {
      await api.post(submitUrl, { reason });
      router.push(`/result/${currentAttemptId}`);
    } catch (err: any) {
      const retryInterval = setInterval(async () => {
        try {
          await api.post(submitUrl, { reason });
          clearInterval(retryInterval);
          router.push(`/result/${currentAttemptId}`);
        } catch { }
      }, 5000);
    }
  }

  // ── Render Option Button with Lock Logic ─────────────────────────────────
  const renderMCQOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    const isSelected = answers[currentQ!.id] === opt;
    return (
      <button
        key={opt}
        id={`option-${opt}`}
        onClick={() => !isLocked && handleAnswer(opt)}
        disabled={isLocked}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 font-bold shadow-sm
          ${isSelected
            ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 dark:text-cyan-400'
            : 'border-slate-200 dark:border-[#333333] bg-white/50 dark:bg-[#111111] text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/[0.05]'}
          ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors duration-300
          ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-[#333333] text-slate-500 dark:text-white/40'}`}>
          {opt}
        </span>
        <span className={isSelected ? 'text-slate-900 dark:text-cyan-100' : 'text-slate-700 dark:text-white/80'}>{currentQ!.payload.options![opt]}</span>
      </button>
    );
  };

  // ── Palette status ─────────────────────────────────────────────────────────
  function paletteStatus(q: Question): PaletteStatus {
    if (markedReview.has(q.id)) return 'review';
    if (answers[q.id]) return 'answered';
    if (visited.has(q.id)) return 'unanswered';
    return 'unvisited';
  }

  const paletteColors: Record<PaletteStatus, string> = {
    unvisited: 'bg-slate-200 dark:bg-[#222222] text-slate-600 dark:text-white/40 border-slate-300 dark:border-[#333333]',
    unanswered: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',
    answered: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    review: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/30',
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center ${manrope.className}`}>
        <div className="w-8 h-8 border-[3px] border-slate-300 dark:border-[#333333] border-t-slate-800 dark:border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  // ── System Check View ──────────────────────────────────────────────────────
  if (!permissionsGranted) {
    const allSet = permCheck.camera && permCheck.location && permCheck.clipboard;

    return (
      <div className={`min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6 select-none ${manrope.className} transition-colors duration-500`}>
        {/* --- Ambient Radial Glow Background --- */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-500 opacity-60 dark:hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        </div>

        <GlassCard className="relative z-10 max-w-xl w-full p-10 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg transition-colors">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">System Check</h1>
              <p className="text-slate-500 dark:text-white/50 text-sm font-bold mt-1 transition-colors">Mandatory verification before beginning</p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            {/* Camera */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border transition-colors duration-500 shadow-sm ${permCheck.camera ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100/50 dark:bg-[#111111] border-slate-200 dark:border-[#222222]'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors duration-500 ${permCheck.camera ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-[#222222] text-slate-500 dark:text-white/40'}`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">Camera Access</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-white/50 transition-colors">Required for visual proctoring</div>
                </div>
              </div>
              {permCheck.camera ? (
                 <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Ready</span>
              ) : (
                 <div className="relative w-24 h-16 bg-slate-200 dark:bg-[#0a0a0a] rounded-xl overflow-hidden border border-slate-300 dark:border-[#333333] transition-colors">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    {!stream && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-500 dark:text-white/40 uppercase font-black tracking-widest">Waiting...</div>}
                 </div>
              )}
            </div>

            {/* Location */}
            <button 
              onClick={requestLocation}
              disabled={permCheck.location}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-colors duration-500 text-left shadow-sm ${permCheck.location ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100/50 dark:bg-[#111111] border-slate-200 dark:border-[#222222] hover:border-cyan-300 dark:hover:border-cyan-500/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors duration-500 ${permCheck.location ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-[#222222] text-slate-500 dark:text-white/40'}`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">Geolocation</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-white/50 transition-colors">Verifying examination center</div>
                </div>
              </div>
              {permCheck.location ? (
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified</span>
              ) : (
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest hover:underline">Allow Access</span>
              )}
            </button>

            {/* Clipboard */}
            <button 
              onClick={requestClipboard}
              disabled={permCheck.clipboard}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-colors duration-500 text-left shadow-sm ${permCheck.clipboard ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100/50 dark:bg-[#111111] border-slate-200 dark:border-[#222222] hover:border-cyan-300 dark:hover:border-cyan-500/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors duration-500 ${permCheck.clipboard ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-[#222222] text-slate-500 dark:text-white/40'}`}>
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">Integrity Protection</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-white/50 transition-colors">Clipboard & multi-tab monitoring</div>
                </div>
              </div>
              {permCheck.clipboard ? (
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
              ) : (
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest hover:underline">Enable Check</span>
              )}
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 flex gap-4 mb-8 shadow-sm transition-colors">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200/70 leading-relaxed font-bold">
              By starting the exam, you agree to continuous camera monitoring and tab-switch tracking. Exiting fullscreen or switching tabs will be logged as a violation.
            </p>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!allSet}
            className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest text-sm ${allSet ? 'bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95' : 'bg-slate-200 dark:bg-[#222222] text-slate-400 dark:text-white/20 cursor-not-allowed'}`}
          >
            Start Examination
            <ArrowRight className="w-5 h-5" />
          </button>
        </GlassCard>
      </div>
    );
  }

  // ── Main Exam View ─────────────────────────────────────────────────────────
  const currentQ = questions[currentIdx];
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const timerStr = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const timerCritical = timeLeft < 300;

  return (
    <div className={`h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white/90 flex flex-col overflow-hidden select-none ${manrope.className} transition-colors duration-500 relative`}>
      {/* --- Ambient Radial Glow Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-500 opacity-60 dark:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0a0a0a]  border-b border-slate-200 dark:border-[#222222] flex-shrink-0 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center transition-colors shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-slate-900 dark:text-white font-black tracking-tight transition-colors">ExamForge</span>
        </div>

        <div id="exam-timer" className={`font-mono text-2xl font-black tabular-nums px-5 py-2 rounded-2xl border shadow-sm transition-colors
          ${timerCritical
            ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-900/30 animate-pulse'
            : 'text-slate-900 dark:text-white border-slate-200 dark:border-[#333333] bg-white dark:bg-[#222222]'}`}>
          {timerStr}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 shadow-sm transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Proctored
          </div>
          <button
            id="submit-exam-btn"
            onClick={() => handleSubmit(false)}
            className="bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl text-xs transition-transform shadow-lg"
          >
            Submit
          </button>
        </div>
      </header>

      {proctorAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-100 dark:bg-red-900/80 border border-red-300 dark:border-red-500/60 text-red-800 dark:text-red-200 text-sm font-black px-8 py-4 rounded-3xl backdrop-blur-xl shadow-2xl animate-bounce flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" /> {proctorAlert}
        </div>
      )}

      {/* Floating Video Feed */}
      <div className="fixed bottom-8 right-8 z-[60] group">
        <GlassCard className="relative w-48 h-36 overflow-hidden shadow-2xl transition-all group-hover:scale-105 border-2 group-hover:border-cyan-500/50">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black backdrop-blur-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Live</span>
          </div>
        </GlassCard>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 flex flex-col scroll-smooth">
          {currentQ ? (
            <div className={`max-w-4xl mx-auto w-full relative ${lockedSections.has(currentQ.section_id) ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              {lockedSections.has(currentQ.section_id) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm rounded-3xl">
                  <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 px-6 py-4 rounded-3xl font-black text-lg flex items-center gap-3 shadow-2xl">
                    <Clock className="w-6 h-6" /> Section Locked
                  </div>
                </div>
              )}

              <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">
                {currentQ.section_title}
              </div>

              <div className="flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-white/50 mb-6 uppercase tracking-widest">
                <span>Question {examType === 'adaptive' ? adaptiveQNum : currentIdx + 1} {examType === 'fixed' && `OF ${questions.length}`}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                <span className="text-emerald-600 dark:text-emerald-400">+{currentQ.marks} PTS</span>
                {currentQ.negative_marks < 0 && (
                  <span className="text-red-600 dark:text-red-400">{currentQ.negative_marks} PTS</span>
                )}
              </div>

              <GlassCard className="p-8 lg:p-10 mb-8 shadow-sm">
                <p className="text-slate-900 dark:text-white text-xl md:text-2xl font-semibold leading-relaxed transition-colors">
                  {currentQ.payload.text}
                </p>
              </GlassCard>

              {currentQ.qtype === 'MCQ' && currentQ.payload.options && (
                <div className="space-y-4">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => renderMCQOption(opt))}
                </div>
              )}

              {currentQ.qtype === 'MULTI_CORRECT' && currentQ.payload.options && (
                <div className="space-y-4">
                  <p className="text-slate-500 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-2 ml-2">Select all that apply</p>
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const selected = (answers[currentQ.id] || '').split(',').includes(opt);
                    return (
                      <button
                        key={opt}
                        id={`multi-option-${opt}`}
                        onClick={() => !isLocked && handleMultiAnswer(opt)}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 shadow-sm
                          ${selected
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-slate-900 dark:text-cyan-400'
                            : 'border-slate-200 dark:border-[#333333] bg-white dark:bg-[#111111] text-slate-700 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/[0.05]'}
                          ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors
                          ${selected ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 dark:border-[#444444]'}`}>
                          {selected && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </span>
                        <span className="font-black text-slate-400 dark:text-white/30 mr-1">{opt}.</span>
                        <span className="font-semibold">{currentQ.payload.options![opt]}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.qtype === 'NAT' && (
                <div className="mt-4">
                  <label className="text-slate-500 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-3 block ml-2">Numerical Answer</label>
                  <input
                    id="nat-input"
                    type="number"
                    step="any"
                    disabled={isLocked}
                    value={answers[currentQ.id] || ''}
                    onChange={e => !isLocked && handleAnswer(e.target.value)}
                    className={`bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#333333] rounded-2xl px-6 py-4 text-slate-900 dark:text-white text-2xl font-black w-64 shadow-sm
                               focus:outline-none focus:border-cyan-500 transition-colors
                               ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-12">
                {examType === 'fixed' && (
                  <button
                    id="prev-btn"
                    onClick={() => !isLocked && currentIdx > 0 && navigateTo(currentIdx - 1)}
                    disabled={currentIdx === 0 || isLocked}
                    className="px-6 py-3 rounded-2xl bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#333333] hover:bg-white dark:hover:bg-white/[0.1] disabled:opacity-30 text-slate-900 dark:text-white text-sm font-bold transition-all shadow-sm"
                  >
                    ← Previous
                  </button>
                )}
                
                {examType === 'fixed' && (
                  <button
                    id="mark-review-btn"
                    onClick={() => !isLocked && toggleMarkReview()}
                    disabled={isLocked}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm
                      ${markedReview.has(currentQ.id)
                        ? 'bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400'
                        : 'bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#333333] text-slate-700 dark:text-white/60 hover:bg-white dark:hover:bg-white/[0.1]'}
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {markedReview.has(currentQ.id) ? '★ Marked for Review' : '☆ Mark for Review'}
                  </button>
                )}

                <button
                  id="clear-answer-btn"
                  onClick={() => !isLocked && setAnswers(prev => { const n = {...prev}; delete n[currentQ!.id]; return n; })}
                  disabled={isLocked}
                  className="px-6 py-3 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#333333] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 text-slate-500 dark:text-white/40 text-sm font-bold transition-all shadow-sm disabled:opacity-30"
                >
                  Clear Answer
                </button>

                {examType === 'adaptive' ? (
                  <button
                    id="next-adaptive-btn"
                    onClick={() => !isLocked && handleNextAdaptive()}
                    disabled={loadingNext || isLocked}
                    className="ml-auto px-8 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 disabled:opacity-50 text-sm font-black uppercase tracking-widest transition-transform shadow-lg"
                  >
                    {loadingNext ? 'Loading...' : 'Save & Next →'}
                  </button>
                ) : (
                  <button
                    id="next-btn"
                    onClick={() => !isLocked && currentIdx < questions.length - 1 && navigateTo(currentIdx + 1)}
                    disabled={currentIdx === questions.length - 1 || isLocked}
                    className="ml-auto px-8 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 text-sm font-black uppercase tracking-widest transition-transform shadow-lg"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">You've reached the end</h2>
                <p className="text-slate-500 dark:text-white/50 font-medium mb-8">Please review your answers or submit.</p>
                <button onClick={() => handleSubmit(false)} className="bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-transform shadow-2xl">Submit Exam Now</button>
             </div>
          )}
        </main>

        {examType === 'fixed' && (
          <aside className="w-80 flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-l border-slate-200 dark:border-[#222222]  overflow-y-auto p-6 transition-colors">
            <h2 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest mb-6">Question Palette</h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { color: 'bg-slate-200 dark:bg-[#222222] border-slate-300 dark:border-[#333333]', label: 'Not Visited' },
                { color: 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/30', label: 'Not Answered' },
                { color: 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30', label: 'Answered' },
                { color: 'bg-violet-100 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500/30', label: 'Marked' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-md border flex-shrink-0 ${color}`} />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  id={`palette-q-${idx + 1}`}
                  onClick={() => navigateTo(idx)}
                  className={`w-11 h-11 rounded-xl border text-xs font-black transition-all duration-300 shadow-sm
                    ${paletteColors[paletteStatus(q)]}
                    ${currentIdx === idx ? 'ring-4 ring-cyan-500/50 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#030303] scale-110 z-10' : 'hover:scale-105'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <GlassCard className="mt-10 p-5 shadow-sm">
              <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
                <div className="flex justify-between items-center text-slate-500 dark:text-white/50">
                  <span>Answered</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">{Object.keys(answers).length}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-white/50">
                  <span>Not Answered</span>
                  <span className="text-red-600 dark:text-red-400 text-lg font-black">{visited.size - Object.keys(answers).length}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-white/50">
                  <span>Marked</span>
                  <span className="text-violet-600 dark:text-violet-400 text-lg font-black">{markedReview.size}</span>
                </div>
              </div>
            </GlassCard>
          </aside>
        )}
      </div>
    </div>
  );
}
