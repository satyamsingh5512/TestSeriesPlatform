'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type QuestionType = 'MCQ' | 'NAT' | 'MULTI_CORRECT';
type DifficultyTier = 'easy' | 'medium' | 'hard';

interface Question {
  type: QuestionType;
  difficulty_tier: DifficultyTier;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  marks_correct: number;
  marks_incorrect: number;
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

const defaultQuestion = (): Question => ({
  type: 'MCQ',
  difficulty_tier: 'medium',
  text: '',
  options: { A: '', B: '', C: '', D: '' },
  correct_answer: '',
  marks_correct: 4,
  marks_incorrect: -1,
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
    title: '', type: 'fixed', description: '', duration_minutes: 180, total_marks: 0, negative_marking: true,
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
      // 1. Create exam
      const { data: examData } = await api.post('/api/admin/exams', examMeta);
      const examId = examData.exam.id;

      // 2. Create sections + questions
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        const { data: secData } = await api.post(`/api/admin/exams/${examId}/sections`, {
          title: sec.title || `Section ${si + 1}`,
          duration_minutes: sec.duration_minutes ? parseInt(sec.duration_minutes) : null,
          sequence: si,
        });
        const sectionId = secData.section.id;

        for (let qi = 0; qi < sec.questions.length; qi++) {
          const q = sec.questions[qi];
          await api.post(`/api/admin/sections/${sectionId}/questions`, {
            ...q,
            options: q.type !== 'NAT' ? q.options : null,
            sequence: qi,
          });
        }
      }

      router.push('/admin/exams');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <span className="text-white font-semibold">Create New Exam</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-400 text-sm">{error}</span>}
          <button
            id="save-exam-btn"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition"
          >
            {saving ? 'Saving…' : 'Save Exam'}
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* ── Exam Meta ─────────────────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">Exam Details</h2>
          <div className="flex gap-4">
            <input
              id="exam-title"
              placeholder="Exam Title *"
              value={examMeta.title}
              onChange={e => setExamMeta(m => ({ ...m, title: e.target.value }))}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={examMeta.type}
              onChange={e => setExamMeta(m => ({ ...m, type: e.target.value as 'fixed' | 'adaptive' }))}
              className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fixed">Fixed</option>
              <option value="adaptive">Adaptive (CAT)</option>
            </select>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={examMeta.description}
            onChange={e => setExamMeta(m => ({ ...m, description: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
          />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Duration (min)</label>
              <input type="number" value={examMeta.duration_minutes}
                onChange={e => setExamMeta(m => ({ ...m, duration_minutes: parseInt(e.target.value) || 180 }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Total Marks</label>
              <input type="number" value={examMeta.total_marks}
                onChange={e => setExamMeta(m => ({ ...m, total_marks: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={examMeta.negative_marking}
                  onChange={e => setExamMeta(m => ({ ...m, negative_marking: e.target.checked }))}
                  className="w-4 h-4 accent-blue-500" />
                <span className="text-slate-300 text-sm">Negative marking</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Sections ──────────────────────────────────────────────────────── */}
        {sections.map((sec, si) => (
          <div key={si} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-semibold">Section {si + 1}</h3>
              <input
                placeholder="Section title"
                value={sec.title}
                onChange={e => updateSection(si, 'title', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Duration (min)"
                value={sec.duration_minutes}
                onChange={e => updateSection(si, 'duration_minutes', e.target.value)}
                className="w-32 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Questions */}
            {sec.questions.map((q, qi) => (
              <div key={qi} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm font-mono">Q{qi + 1}</span>
                  <select
                    id={`q-type-${si}-${qi}`}
                    value={q.type}
                    onChange={e => updateQuestion(si, qi, 'type', e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="NAT">NAT</option>
                    <option value="MULTI_CORRECT">Multi-correct</option>
                  </select>
                  <select
                    value={q.difficulty_tier}
                    onChange={e => updateQuestion(si, qi, 'difficulty_tier', e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-slate-400 text-xs">+</label>
                    <input type="number" value={q.marks_correct}
                      onChange={e => updateQuestion(si, qi, 'marks_correct', parseFloat(e.target.value))}
                      className="w-14 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm text-center
                                 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <label className="text-slate-400 text-xs">/</label>
                    <input type="number" value={q.marks_incorrect}
                      onChange={e => updateQuestion(si, qi, 'marks_incorrect', parseFloat(e.target.value))}
                      className="w-14 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm text-center
                                 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <textarea
                  placeholder="Question text *"
                  value={q.text}
                  onChange={e => updateQuestion(si, qi, 'text', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm
                             placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                />

                {q.type !== 'NAT' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <input
                        key={opt}
                        placeholder={`Option ${opt}`}
                        value={q.options[opt]}
                        onChange={e => updateOption(si, qi, opt, e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder={q.type === 'NAT' ? 'Correct answer or range (e.g. 1.5-2.0)' : 'Correct option(s) e.g. A or A,C'}
                    value={q.correct_answer}
                    onChange={e => updateQuestion(si, qi, 'correct_answer', e.target.value)}
                    className="bg-slate-800 border border-green-600/30 rounded-lg px-3 py-2 text-white text-sm
                               placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    placeholder="Explanation (optional)"
                    value={q.explanation}
                    onChange={e => updateQuestion(si, qi, 'explanation', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                               placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}

            <button
              id={`add-question-${si}`}
              onClick={() => addQuestion(si)}
              className="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              + Add Question
            </button>
          </div>
        ))}

        <button
          id="add-section-btn"
          onClick={addSection}
          className="w-full border-2 border-dashed border-slate-600 hover:border-blue-500/50 rounded-xl py-4
                     text-slate-400 hover:text-blue-400 text-sm font-medium transition"
        >
          + Add Section
        </button>
      </main>
    </div>
  );
}
