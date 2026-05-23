'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Manrope } from 'next/font/google';
import { ChevronLeft, Plus, Save, Clock, Target, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

type QuestionType = 'MCQ' | 'NAT' | 'MULTI_CORRECT';
type DifficultyTier = 'easy' | 'medium' | 'hard';

interface Question {
  qtype: QuestionType;
  difficulty_tier: DifficultyTier;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_key: string;
  marks: number;
  negative_marks: number;
  explanation: string;
}

interface Section {
  title: string;
  duration_minutes: string;
  questions: Question[];
}

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

const defaultQuestion = (): Question => ({
  qtype: 'MCQ',
  difficulty_tier: 'medium',
  text: '',
  options: { A: '', B: '', C: '', D: '' },
  correct_key: '',
  marks: 4,
  negative_marks: -1,
  explanation: '',
});

const defaultSection = (): Section => ({
  title: '',
  duration_minutes: '',
  questions: [defaultQuestion()],
});

export default function CreateExamPage() {
  const router = useRouter();
  const [examMeta, setExamMeta] = useState({
    title: '', exam_type: 'fixed', description: '', duration_minutes: 180, total_marks: 0, negative_marking: true,
  });
  const [sections, setSections] = useState<Section[]>([defaultSection()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Section helpers ────────────────────────────────────────────────────────
  const updateSection = (si: number, key: keyof Section, val: any) =>
    setSections(prev => prev.map((s, i) => i === si ? { ...s, [key]: val } : s));

  const addSection = () => setSections(prev => [...prev, defaultSection()]);

  const addQuestion = (si: number) =>
    setSections(prev => prev.map((s, i) => i === si
      ? { ...s, questions: [...s.questions, defaultQuestion()] } : s));

  const updateQuestion = (si: number, qi: number, key: keyof Question, val: any) =>
    setSections(prev => prev.map((s, i) => i !== si ? s : {
      ...s,
      questions: s.questions.map((q, j) => j === qi ? { ...q, [key]: val } : q),
    }));

  const updateOption = (si: number, qi: number, opt: 'A' | 'B' | 'C' | 'D', val: string) =>
    setSections(prev => prev.map((s, i) => i !== si ? s : {
      ...s,
      questions: s.questions.map((q, j) => j !== qi ? q : {
        ...q, options: { ...q.options, [opt]: val },
      }),
    }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!examMeta.title) { setError('Exam title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const api = apiClient();
      await api.post('/api/admin/exams', {
        ...examMeta,
        sections: sections.map(s => ({
            ...s,
            duration_minutes: s.duration_minutes ? parseInt(s.duration_minutes) : null,
            questions: s.questions.map(q => ({
                ...q,
                options: q.qtype !== 'NAT' ? q.options : null
            }))
        }))
      });
      router.push('/admin/exams');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white/90 ${manrope.className} flex flex-col relative transition-colors duration-500 pb-20`}>
      {/* --- Ambient Radial Glow Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-500 opacity-60 dark:hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <nav className="sticky top-0 z-[100] border-b border-slate-200 dark:border-[#222222] bg-white dark:bg-black/80  px-6 py-4 flex items-center justify-between transition-colors duration-500 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/exams')} className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-slate-900 dark:text-white font-bold tracking-tight text-lg">Create New Exam</span>
        </div>
        <div className="flex items-center gap-4">
          {error && <span className="text-red-500 dark:text-red-400 text-sm font-bold">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 font-bold px-6 py-2.5 rounded-2xl text-sm transition-transform shadow-lg flex items-center gap-2"
          >
            {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-4 h-4" /> Save Exam</>}
          </button>
        </div>
      </nav>

      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* ── Exam Meta ─────────────────────────────────────────────────────── */}
        <GlassCard className="p-8 shadow-sm">
          <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Exam Details
          </h2>
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                placeholder="Exam Title *"
                value={examMeta.title}
                onChange={e => setExamMeta(m => ({ ...m, title: e.target.value }))}
                className="flex-1 bg-slate-100/50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors font-semibold"
              />
              <select
                value={examMeta.exam_type}
                onChange={e => setExamMeta(m => ({ ...m, exam_type: e.target.value as 'fixed' | 'adaptive' }))}
                className="bg-slate-100/50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-colors font-bold"
              >
                <option value="fixed">Fixed Layout</option>
                <option value="adaptive">Adaptive (CAT)</option>
              </select>
            </div>
            
            <textarea
              placeholder="Description (optional)"
              value={examMeta.description}
              onChange={e => setExamMeta(m => ({ ...m, description: e.target.value }))}
              className="w-full bg-slate-100/50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none h-24 font-medium"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-100/50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-2xl p-4 transition-colors">
                <label className="text-slate-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Duration (min)</label>
                <input type="number" value={examMeta.duration_minutes} onChange={e => setExamMeta(m => ({ ...m, duration_minutes: parseInt(e.target.value) || 180 }))}
                  className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white focus:outline-none" />
              </div>
              <div className="bg-slate-100/50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-2xl p-4 transition-colors">
                <label className="text-slate-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target className="w-3 h-3" /> Total Marks</label>
                <input type="number" value={examMeta.total_marks} onChange={e => setExamMeta(m => ({ ...m, total_marks: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white focus:outline-none" />
              </div>
              <div className="flex items-center justify-center p-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${examMeta.negative_marking ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-[#222222]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${examMeta.negative_marking ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={examMeta.negative_marking} onChange={e => setExamMeta(m => ({ ...m, negative_marking: e.target.checked }))} />
                  <span className="text-slate-700 dark:text-white/70 text-sm font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Negative marking</span>
                </label>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Sections ──────────────────────────────────────────────────────── */}
        {sections.map((sec, si) => (
          <GlassCard key={si} className="p-8 shadow-sm border-t-4 border-t-violet-500/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-black flex items-center justify-center flex-shrink-0">
                S{si + 1}
              </div>
              <input
                placeholder="Section title"
                value={sec.title}
                onChange={e => updateSection(si, 'title', e.target.value)}
                className="flex-1 bg-transparent border-b-2 border-slate-200 dark:border-[#333333] px-2 py-2 text-slate-900 dark:text-white text-lg font-bold placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-xl px-4 py-2">
                <Clock className="w-4 h-4 text-slate-500 dark:text-white/40" />
                <input
                  type="number"
                  placeholder="Mins"
                  value={sec.duration_minutes}
                  onChange={e => updateSection(si, 'duration_minutes', e.target.value)}
                  className="w-16 bg-transparent text-slate-900 dark:text-white text-sm font-bold focus:outline-none text-center"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {sec.questions.map((q, qi) => (
                <div key={qi} className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] rounded-2xl p-6 transition-colors">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="bg-slate-200 dark:bg-[#222222] text-slate-600 dark:text-white/50 px-3 py-1 rounded-lg text-xs font-black">Q{qi + 1}</span>
                    <select
                      value={q.qtype}
                      onChange={e => updateQuestion(si, qi, 'qtype', e.target.value)}
                      className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#333333] rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="NAT">NAT</option>
                      <option value="MULTI_CORRECT">Multi-correct</option>
                    </select>
                    <select
                      value={q.difficulty_tier}
                      onChange={e => updateQuestion(si, qi, 'difficulty_tier', e.target.value)}
                      className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#333333] rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <div className="flex items-center gap-1.5 ml-auto bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#333333] rounded-lg px-2 py-1">
                      <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black">+</span>
                      <input type="number" value={q.marks} onChange={e => updateQuestion(si, qi, 'marks', parseFloat(e.target.value))}
                        className="w-8 bg-transparent text-slate-900 dark:text-white text-xs font-bold text-center focus:outline-none" />
                      <span className="text-slate-300 dark:text-white/20 text-xs">|</span>
                      <input type="number" value={q.negative_marks} onChange={e => updateQuestion(si, qi, 'negative_marks', parseFloat(e.target.value))}
                        className="w-10 bg-transparent text-red-500 dark:text-red-400 text-xs font-bold text-center focus:outline-none" />
                    </div>
                  </div>

                  <textarea
                    placeholder="Type your question here..."
                    value={q.text}
                    onChange={e => updateQuestion(si, qi, 'text', e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#333333] rounded-xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-cyan-500/50 resize-none h-24 font-medium mb-4"
                  />

                  {q.qtype !== 'NAT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => (
                        <div key={opt} className="flex items-center bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#333333] rounded-xl overflow-hidden focus-within:border-cyan-500/50 transition-colors">
                          <span className="px-4 py-3 bg-slate-100 dark:bg-[#111111] text-slate-500 dark:text-white/40 font-black border-r border-slate-200 dark:border-[#333333]">{opt}</span>
                          <input
                            placeholder={`Option ${opt}`}
                            value={q.options[opt]}
                            onChange={e => updateOption(si, qi, opt, e.target.value)}
                            className="flex-1 px-4 py-3 bg-transparent text-slate-900 dark:text-white text-sm font-medium placeholder-slate-400 dark:placeholder-white/20 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-t border-slate-200/50 dark:border-[#222222] pt-5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2 block">Correct Answer</label>
                      <input
                        placeholder={q.qtype === 'NAT' ? 'e.g. 1.5-2.0' : 'e.g. A or A,C'}
                        value={q.correct_key}
                        onChange={e => updateQuestion(si, qi, 'correct_key', e.target.value)}
                        className="w-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-800 dark:text-emerald-300 font-bold placeholder-emerald-300 dark:placeholder-emerald-500/40 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-white/40 mb-2 block">Explanation (Optional)</label>
                      <input
                        placeholder="Why is this correct?"
                        value={q.explanation}
                        onChange={e => updateQuestion(si, qi, 'explanation', e.target.value)}
                        className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#333333] rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm font-medium placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addQuestion(si)}
              className="mt-6 flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors px-4 py-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </GlassCard>
        ))}

        <button
          onClick={addSection}
          className="w-full border-2 border-dashed border-slate-300 dark:border-[#333333] hover:border-cyan-500/50 rounded-3xl py-6 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-white/30 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#222222] group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
             <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold">Add Another Section</span>
        </button>
      </main>
    </div>
  );
}