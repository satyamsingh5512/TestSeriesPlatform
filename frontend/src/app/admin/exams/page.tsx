'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { BookOpen, Plus, Settings2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingExam, setEditingExam] = useState<any>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', duration_minutes: 180, total_marks: 100, exam_type: 'fixed', status: 'published' });
  const [saving, setSaving] = useState(false);

  const fetchExams = () => {
    setLoading(true);
    apiClient().get('/api/admin/exams').then(r => setExams(r.data.exams)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const openEditModal = (ex: any) => {
    setEditingExam(ex);
    setEditForm({
      title: ex.title || '',
      duration_minutes: ex.duration_minutes || 180,
      total_marks: ex.total_marks || 100,
      exam_type: ex.exam_type || 'fixed',
      status: ex.status || 'published'
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient().patch(`/api/admin/exams/${editingExam.id}`, editForm);
      setEditModalOpen(false);
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!editingExam) return;
    if (!confirm(`Are you sure you want to delete "${editingExam.title}"? This will permanently remove all questions and student attempts associated with it.`)) return;
    
    setSaving(true);
    try {
      await apiClient().delete(`/api/admin/exams/${editingExam.id}`);
      setEditModalOpen(false);
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete exam');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-panel-hover rounded w-1/4"></div>
        <div className="flex gap-3"><div className="h-10 bg-panel-hover rounded w-24"></div><div className="h-10 bg-panel-hover rounded w-32"></div></div>
      </div>
      <div className="h-64 bg-panel-hover rounded-xl border border-themeBorder"></div>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-highlight">Exam Control</h1>
          <p className="text-sm text-muted mt-1">Manage tests and monitor active sessions.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/features" className="btn btn-secondary"><Settings2 className="w-4 h-4"/> Modules</Link>
          <Link href="/admin/exams/create" className="btn btn-primary shadow-crisp"><Plus className="w-4 h-4"/> New Exam</Link>
        </div>
      </header>

      {exams.length === 0 ? (
        <div className="panel p-12 text-center border-dashed"><p className="text-sm text-muted">No exams configured.</p></div>
      ) : (
        <div className="panel overflow-hidden border-themeBorder">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-panel-hover border-b border-themeBorder text-xs uppercase tracking-widest text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Uploaded On</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-themeBorder">
              {exams.map(ex => (
                <tr key={ex.id} className="hover:bg-panel-hover transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{ex.title}</td>
                  <td className="px-6 py-4 text-muted"><span className="status-tag">{ex.exam_type}</span></td>
                  <td className="px-6 py-4"><span className={`status-tag ${ex.status === 'published' ? 'status-success' : ''}`}>{ex.status}</span></td>
                  <td className="px-6 py-4 text-muted text-xs">{new Date(ex.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/exams/${ex.id}/attempts`} className="text-accent hover:underline text-xs font-semibold">Logs</Link>
                    <button onClick={() => openEditModal(ex)} className="text-muted hover:text-highlight text-xs font-semibold ml-4">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="panel w-full max-w-md p-6 bg-[var(--bg-base)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-highlight">Edit Exam</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-muted hover:text-highlight"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Exam Title</label>
                  <input required value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full" placeholder="e.g. Midterm 2026" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Duration (mins)</label>
                    <input type="number" required value={editForm.duration_minutes} onChange={e => setEditForm({...editForm, duration_minutes: Number(e.target.value)})} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Total Marks</label>
                    <input type="number" required value={editForm.total_marks} onChange={e => setEditForm({...editForm, total_marks: Number(e.target.value)})} className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Format</label>
                    <select value={editForm.exam_type} onChange={e => setEditForm({...editForm, exam_type: e.target.value})} className="w-full">
                      <option value="fixed">Standard</option>
                      <option value="adaptive">Adaptive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Status</label>
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-between gap-3 border-t border-themeBorder mt-4">
                  <button type="button" onClick={handleDeleteExam} disabled={saving} className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 shadow-none">
                    Delete Test
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditModalOpen(false)} className="btn bg-panel hover:bg-panel-hover text-muted">Cancel</button>
                    <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50 shadow-crisp">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
