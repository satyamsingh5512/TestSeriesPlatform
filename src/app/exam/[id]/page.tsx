'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useProctor } from '@/hooks/useProctor';

// ─── Types ────────────────────────────────────────────────────────────────────
type QuestionType = 'MCQ' | 'NAT' | 'MULTI_CORRECT';
interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: { A: string; B: string; C: string; D: string } | null;
  marks_correct: number;
  marks_incorrect: number;
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

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
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

  // ── Proctoring ─────────────────────────────────────────────────────────────
  useProctor({
    attemptId,
    enabled: !loading && !submitted,
    onViolation: (type) => {
      const messages: Record<string, string> = {
        NO_FACE: '⚠️ No face detected — please stay visible.',
        MULTIPLE_FACES: '⚠️ Multiple faces detected.',
        PHONE_DETECTED: '⚠️ Possible device detected near face.',
      };
      setProctorAlert(messages[type] || `⚠️ Proctoring violation: ${type}`);
      setTimeout(() => setProctorAlert(null), 4000);
    }
  });

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
        // 1. Fetch exam metadata
        const { data: examData } = await api.get(`/api/exams/${id}`);
        const type = examData.exam.type || 'fixed';
        const dur = examData.exam.duration_minutes * 60;
        setExamType(type);
        setExamDuration(dur);
        setTimeLeft(dur);

        // 2. Start attempt
        const { data: startData } = await api.post(`/api/exams/${id}/start`);
        const aId = startData.attempt_id;
        setAttemptId(aId);
        attemptIdRef.current = aId;

        // 3. Get existing responses
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
            // No questions available
            setQuestions([]);
          }
        } else {
          setQuestions(data.questions);
        }

        setLoading(false);
        document.documentElement.requestFullscreen?.().catch(() => {});
      } catch {
        router.push('/dashboard');
      }
    }
    loadExam();
    return cleanup;
  }, [id, router]);

  // ── Section Timer Logic (Fixed only) ───────────────────────────────────────
  useEffect(() => {
    if (examType === 'adaptive' || !questions.length || submitted) return;
    const currentQ = questions[currentIdx];
    if (!currentQ?.section_duration) return;

    const sectionQuestions = questions.filter(q => q.section_id === currentQ.section_id);
    const totalSpent = sectionQuestions.reduce((acc, q) => acc + (timeSpent[q.id] || 0), 0);

    if (totalSpent >= currentQ.section_duration * 60) {
      setLockedSections(prev => new Set(prev).add(currentQ.section_id));
      const nextIdx = questions.findIndex((q, i) => i > currentIdx && q.section_id !== currentQ.section_id);
      if (nextIdx !== -1) {
        setCurrentIdx(nextIdx);
      }
    }
  }, [timeSpent, currentIdx, questions, submitted, examType]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, submitted]);

  // ── Batch Sync every 15s ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted) return;
    syncIntervalRef.current = setInterval(() => syncAnswers(), 15000);
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
  }, [loading, submitted]);

  // ── Anti-cheat event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const onVisibility = () => {
      if (document.hidden) logViolation('TAB_SWITCH', {});
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) logViolation('FULLSCREEN_EXIT', {});
    };
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logViolation('COPY_PASTE_ATTEMPT', { key: e.key });
      }
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onBeforeUnload = () => syncAnswers();

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [loading]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function logViolation(type: string, details: any) {
    violationBatchRef.current.push({ type, details, occurred_at: new Date().toISOString() });
    if (violationBatchRef.current.length >= 10) flushViolations();
  }

  async function flushViolations() {
    if (!attemptIdRef.current || !violationBatchRef.current.length) return;
    const batch = violationBatchRef.current.splice(0);
    try {
      await apiClient().post(`/api/attempts/${attemptIdRef.current}/violations`, { violations: batch });
    } catch { /* non-critical */ }
  }

  async function syncAnswers() {
    if (!attemptIdRef.current) return;
    recordTimeOnCurrentQuestion(); // Update time spent before syncing
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
    } catch { /* retry on next interval */ }
  }

  function recordTimeOnCurrentQuestion() {
    const q = questions[currentIdx];
    if (!q) return;
    const spent = Math.floor((Date.now() - questionStartTime) / 1000);
    setTimeSpent(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + spent }));
    setQuestionStartTime(Date.now());
  }

  function navigateTo(idx: number) {
    if (examType === 'adaptive') return; // Cannot navigate freely in CAT
    recordTimeOnCurrentQuestion();
    const q = questions[idx];
    if (q) setVisited(v => new Set(v).add(q.id));
    setCurrentIdx(idx);
    setQuestionStartTime(Date.now());
  }

  async function handleNextAdaptive() {
    if (!attemptIdRef.current) return;
    setLoadingNext(true);
    await syncAnswers(); // Important to sync current answer before getting next based on it
    try {
      const { data } = await apiClient().get(`/api/attempts/${attemptIdRef.current}/next-question`);
      if (data.question) {
        setQuestions([data.question]);
        setCurrentIdx(0);
        setAdaptiveQNum(data.current_question_number);
        setQuestionStartTime(Date.now());
      } else {
        await handleSubmit(true); // Exam over
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
      if (!firstAnswers[q.id]) {
        setFirstAnswers(prev => ({ ...prev, [q.id]: answer }));
      }
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
      if (!firstAnswers[q.id]) {
        setFirstAnswers(prev => ({ ...prev, [q.id]: newAnswer }));
      }
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

  async function handleSubmit(auto = false) {
    if (submitted) return;
    if (!auto && !confirm('Are you sure you want to submit the exam?')) return;
    setSubmitted(true);
    cleanup();
    await syncAnswers();
    await flushViolations();
    try {
      await apiClient().post(`/api/attempts/${attemptIdRef.current}/submit`);
      router.push(`/result/${attemptIdRef.current}`);
    } catch {
      router.push('/dashboard');
    }
  }

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
  }

  // ── Palette status ─────────────────────────────────────────────────────────
  function paletteStatus(q: Question): PaletteStatus {
    if (markedReview.has(q.id)) return 'review';
    if (answers[q.id]) return 'answered';
    if (visited.has(q.id)) return 'unanswered';
    return 'unvisited';
  }

  const paletteColors: Record<PaletteStatus, string> = {
    unvisited: 'bg-slate-700 text-slate-300 border-slate-600',
    unanswered: 'bg-red-900/50 text-red-300 border-red-700',
    answered: 'bg-green-700 text-white border-green-600',
    review: 'bg-purple-700 text-white border-purple-600',
  };

  // ── Timer format ───────────────────────────────────────────────────────────
  const timerCritical = timeLeft < 300;
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const timerStr = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const currentQ = questions[currentIdx];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading exam…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden select-none">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-white font-semibold">ExamForge</span>
        </div>

        {/* Timer */}
        <div id="exam-timer" className={`font-mono text-2xl font-bold tabular-nums px-4 py-1.5 rounded-xl border
          ${timerCritical
            ? 'text-red-400 border-red-500/50 bg-red-900/30 animate-pulse'
            : 'text-white border-slate-600 bg-slate-700'}`}>
          {timerStr}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600 px-3 py-1.5 rounded-xl text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Proctored
          </div>
          <button
            id="submit-exam-btn"
            onClick={() => handleSubmit(false)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {proctorAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-900/80 border border-red-500/60 text-red-200 text-sm font-semibold px-6 py-3 rounded-2xl backdrop-blur-sm shadow-xl animate-bounce">
          {proctorAlert}
        </div>
      )}

      {/* ── Main Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Question Area */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          {currentQ ? (
            <div className={`p-8 overflow-y-auto relative ${lockedSections.has(currentQ.section_id) ? 'opacity-60 grayscale' : ''}`}>
              {lockedSections.has(currentQ.section_id) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-3 rounded-2xl font-bold flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3z" /></svg>
                    This section is locked (Time Expired)
                  </div>
                </div>
              )}

              <div className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">
                {currentQ.section_title}
              </div>

              <div className="text-slate-400 text-sm mb-4">
                Question <span className="text-white font-semibold">{examType === 'adaptive' ? adaptiveQNum : currentIdx + 1}</span>
                {examType === 'fixed' && <> of <span className="text-white font-semibold">{questions.length}</span></>}
                {' · '}
                <span className="text-green-400">+{currentQ.marks_correct}</span>
                {currentQ.marks_incorrect < 0 && (
                  <span className="text-red-400"> / {currentQ.marks_incorrect}</span>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">{currentQ.text}</p>
              </div>

              {currentQ.type === 'MCQ' && currentQ.options && (
                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <button
                      key={opt}
                      id={`option-${opt}`}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150
                        ${answers[currentQ.id] === opt
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-750'}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                        ${answers[currentQ.id] === opt ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {opt}
                      </span>
                      <span>{currentQ.options![opt]}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentQ.type === 'MULTI_CORRECT' && currentQ.options && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-xs mb-1">Select all that apply</p>
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const selected = (answers[currentQ.id] || '').split(',').includes(opt);
                    return (
                      <button
                        key={opt}
                        id={`multi-option-${opt}`}
                        onClick={() => handleMultiAnswer(opt)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                          ${selected
                            ? 'border-blue-500 bg-blue-600/20 text-white'
                            : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'}`}
                      >
                        <span className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${selected ? 'border-blue-500 bg-blue-600' : 'border-slate-500'}`}>
                          {selected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>}
                        </span>
                        <span className="font-semibold text-slate-400 mr-1">{opt}.</span>
                        <span>{currentQ.options![opt]}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'NAT' && (
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Enter your numerical answer:</label>
                  <input
                    id="nat-input"
                    type="number"
                    step="any"
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg w-48
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 mt-8">
                {examType === 'fixed' && (
                  <button
                    id="prev-btn"
                    onClick={() => currentIdx > 0 && navigateTo(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30
                               text-white text-sm font-medium transition"
                  >
                    ← Previous
                  </button>
                )}
                
                {examType === 'fixed' && (
                  <button
                    id="mark-review-btn"
                    onClick={toggleMarkReview}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition
                      ${markedReview.has(currentQ.id)
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                  >
                    {markedReview.has(currentQ.id) ? '★ Marked' : '☆ Mark Review'}
                  </button>
                )}

                <button
                  id="clear-answer-btn"
                  onClick={() => setAnswers(prev => { const n = {...prev}; delete n[currentQ.id]; return n; })}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition"
                >
                  Clear
                </button>

                {examType === 'adaptive' ? (
                  <button
                    id="next-adaptive-btn"
                    onClick={handleNextAdaptive}
                    disabled={loadingNext}
                    className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                               text-white text-sm font-semibold transition"
                  >
                    {loadingNext ? 'Loading...' : 'Save & Next →'}
                  </button>
                ) : (
                  <button
                    id="next-btn"
                    onClick={() => currentIdx < questions.length - 1 && navigateTo(currentIdx + 1)}
                    disabled={currentIdx === questions.length - 1}
                    className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30
                               text-white text-sm font-semibold transition"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-slate-400 mb-4">No more questions available or Exam Finished.</p>
                <button onClick={() => handleSubmit(false)} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Submit Now</button>
             </div>
          )}
        </main>

        {/* Right — Question Palette (Only for Fixed exams) */}
        {examType === 'fixed' && (
          <aside className="w-72 flex-shrink-0 bg-slate-800 border-l border-slate-700 overflow-y-auto p-4">
            <h2 className="text-white font-semibold text-sm mb-3">Question Palette</h2>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 mb-4 text-xs">
              {[
                { color: 'bg-slate-700 border-slate-600', label: 'Not Visited' },
                { color: 'bg-red-900/50 border-red-700', label: 'Not Answered' },
                { color: 'bg-green-700 border-green-600', label: 'Answered' },
                { color: 'bg-purple-700 border-purple-600', label: 'Marked' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded border flex-shrink-0 ${color}`} />
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  id={`palette-q-${idx + 1}`}
                  onClick={() => navigateTo(idx)}
                  className={`w-10 h-10 rounded-lg border text-xs font-bold transition-all duration-150
                    ${paletteColors[paletteStatus(q)]}
                    ${currentIdx === idx ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-800' : ''}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Answered</span>
                <span className="text-green-400 font-semibold">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Not answered</span>
                <span className="text-red-400 font-semibold">
                  {visited.size - Object.keys(answers).length}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Marked for review</span>
                <span className="text-purple-400 font-semibold">{markedReview.size}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Not visited</span>
                <span className="text-slate-300 font-semibold">{questions.length - visited.size}</span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
