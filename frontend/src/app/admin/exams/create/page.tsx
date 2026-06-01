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
                    <div className="flex gap-3 mb-3"><select value={q.qtype} onChange={e => { const n=[...sections]; n[si].questions[qi].qtype=e.target.value; setSections(n); }} className="w-auto py-1 text-xs"><option value="MCQ">MCQ</option><option value="NAT">NAT</option></select></div>
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
