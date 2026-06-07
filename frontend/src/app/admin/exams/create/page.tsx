'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function CreateExamPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'meta'|'content'>('meta');
  const [meta, setMeta] = useState({ title: '', duration_minutes: 180, total_marks: 100, exam_type: 'fixed' });
  const [sections, setSections] = useState<any[]>([{ title: 'Section 1', duration_minutes: '', questions: [{ qtype: 'MCQ', difficulty_tier: 'medium', text: '', options: {A:'', B:'', C:'', D:''}, correct_key: '', marks: 4, negative_marks: -1 }] }]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [ocrLoading, setOcrLoading] = useState<string | null>(null); // sectionIndex-questionIndex

  const handleOCR = async (sectionIndex: number, questionIndex: number, file: File) => {
    const key = `${sectionIndex}-${questionIndex}`;
    setOcrLoading(key);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await apiClient().post('/api/admin/ocr/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.data?.text) {
        const text = res.data.data.text;
        const parts = text.split(/(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:]?|\d+[\.\)\:])\s+/i).filter((p: string) => p.trim());

        const parsePart = (rawText: string) => {
          let qText = rawText;
          const options = { A: '', B: '', C: '', D: '' };
          let correct_key = '';

          const ansMatch = qText.match(/(?:Ans(?:wer)?|Correct)(?:\s*is|\s*option)?\s*[:\-]?\s*([a-d])/i);
          if (ansMatch) {
            correct_key = ansMatch[1].toUpperCase();
            qText = qText.substring(0, ansMatch.index).trim();
          }

          const optPattern = /(?:^|\s|\n)[\(]?([A-D])[\)\.]\s+((?:(?!\s[\(]?[A-D][\)\.]\s).)*)/gi;
          let match;
          let firstOptIndex = -1;
          while ((match = optPattern.exec(qText)) !== null) {
            if (firstOptIndex === -1) firstOptIndex = match.index;
            const optLetter = match[1].toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(optLetter)) {
              options[optLetter as keyof typeof options] = match[2].trim();
            }
          }

          if (firstOptIndex !== -1) {
            qText = qText.substring(0, firstOptIndex).trim();
          }

          return { text: qText, options, correct_key };
        };

        const n = [...sections];
        if (parts.length > 0) {
          const parsedFirst = parsePart(parts[0]);
          n[sectionIndex].questions[questionIndex].text = parsedFirst.text;
          n[sectionIndex].questions[questionIndex].options = { ...n[sectionIndex].questions[questionIndex].options, ...parsedFirst.options };
          if (parsedFirst.correct_key) n[sectionIndex].questions[questionIndex].correct_key = parsedFirst.correct_key;

          if (parts.length > 1) {
            const newQuestions = parts.slice(1).map((p: string) => {
              const parsed = parsePart(p);
              return {
                qtype: 'MCQ',
                difficulty_tier: 'medium',
                text: parsed.text,
                options: { A: parsed.options.A || '', B: parsed.options.B || '', C: parsed.options.C || '', D: parsed.options.D || '' },
                correct_key: parsed.correct_key,
                marks: 4,
                negative_marks: -1
              };
            });
            n[sectionIndex].questions.splice(questionIndex + 1, 0, ...newQuestions);
          }
        } else {
          n[sectionIndex].questions[questionIndex].text = text;
        }
        setSections(n);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'OCR failed');
    } finally {
      setOcrLoading(null);
    }
  };

  const save = async () => {
    setSaveError('');
    setSaving(true);
    try {
      // Sanitize: convert empty string duration_minutes to null
      const sanitizedSections = sections.map(s => ({
        ...s,
        duration_minutes: s.duration_minutes === '' || s.duration_minutes === null ? null : Number(s.duration_minutes),
        questions: s.questions.map((q: any) => ({
          ...q,
          marks: Number(q.marks) || 4,
          negative_marks: Number(q.negative_marks) || -1,
        }))
      }));
      await apiClient().post('/api/admin/exams', { ...meta, sections: sanitizedSections });
      router.push('/admin/exams');
    } catch (err: any) { 
      setSaveError(err.response?.data?.error || err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-fadeIn space-y-8">
      <header className="flex justify-between items-center border-b border-themeBorder pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-highlight">Exam Builder</h1>
          {saveError && <p className="text-red-500 text-sm mt-1">{saveError}</p>}
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary disabled:opacity-50">
          {saving ? 'Publishing...' : 'Publish Exam'}
        </button>
      </header>

      <div className="flex gap-4 border-b border-themeBorder">
        <button onClick={() => setTab('meta')} className={`pb-3 text-sm font-medium ${tab === 'meta' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}>Configuration</button>
        <button onClick={() => setTab('content')} className={`pb-3 text-sm font-medium ${tab === 'content' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}>Content Structure</button>
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
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <select value={q.qtype} onChange={e => { const n=[...sections]; n[si].questions[qi].qtype=e.target.value; setSections(n); }} className="w-auto py-1 text-xs"><option value="MCQ">MCQ</option><option value="NAT">NAT</option></select>
                      </div>
                      
                      <div className="relative">
                        <button 
                          className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-1 rounded hover:bg-accent/20 flex items-center gap-1"
                          onClick={() => document.getElementById(`ocr-input-${si}-${qi}`)?.click()}
                          disabled={ocrLoading === `${si}-${qi}`}
                        >
                          {ocrLoading === `${si}-${qi}` ? 'Processing...' : '📷 OCR Extract'}
                        </button>
                        <input 
                          type="file" 
                          id={`ocr-input-${si}-${qi}`}
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOCR(si, qi, file);
                          }}
                        />
                      </div>
                    </div>

                    <textarea placeholder="Question text" value={q.text} onChange={e => { const n=[...sections]; n[si].questions[qi].text=e.target.value; setSections(n); }} className="h-20 mb-3" />
                    {q.qtype === 'MCQ' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {['A','B','C','D'].map(opt => <input key={opt} placeholder={`Option ${opt}`} value={q.options[opt]} onChange={e => { const n=[...sections]; n[si].questions[qi].options[opt]=e.target.value; setSections(n); }} className="text-sm" />)}
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
