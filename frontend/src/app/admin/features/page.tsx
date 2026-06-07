'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Edit2, LayoutDashboard, Search, X } from 'lucide-react';
import Link from 'next/link';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = () => {
    setLoading(true);
    apiClient().get('/api/admin/features')
      .then(r => setFeatures(r.data.features))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      await apiClient().patch(`/api/admin/features/${editing.feature_key}`, {
        title: editing.title,
        description: editing.description,
        status: editing.status
      });
      setEditing(null);
      fetchFeatures();
    } catch (err) {
      alert('Failed to update feature');
    }
  };

  if (loading && features.length === 0) return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-panel-hover rounded w-1/4 mb-8"></div>
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-panel-hover rounded-xl border border-themeBorder"></div>)}
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-highlight">Module Management</h1>
          <p className="text-sm text-muted mt-1">Enable, disable, and configure platform modules.</p>
        </div>
        <Link href="/admin/exams" className="btn btn-secondary"><LayoutDashboard className="w-4 h-4 mr-2"/> Return to Exams</Link>
      </header>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-panel-hover border-b border-themeBorder text-xs uppercase tracking-widest text-muted font-semibold">
            <tr>
              <th className="px-6 py-4">Module Name</th>
              <th className="px-6 py-4">Internal Key</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-themeBorder">
            {features.map(f => (
              <tr key={f.feature_key} className="hover:bg-panel-hover transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-primary">{f.title}</p>
                  <p className="text-xs text-muted truncate max-w-[300px]">{f.description}</p>
                </td>
                <td className="px-6 py-4 text-muted font-mono text-xs">{f.feature_key}</td>
                <td className="px-6 py-4">
                  <span className={`status-tag ${f.status === 'active' ? 'status-success' : f.status === 'coming_soon' ? 'status-active' : ''}`}>
                    {f.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(f)} className="text-accent hover:text-highlight text-xs flex items-center justify-end gap-1 ml-auto">
                    <Edit2 className="w-3 h-3"/> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel w-full max-w-lg p-6 md:p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-highlight">Edit Module: {editing.feature_key}</h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-error"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">Display Title</label>
                <input 
                  value={editing.title} 
                  onChange={e => setEditing({...editing, title: e.target.value})}
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">Description</label>
                <textarea 
                  value={editing.description} 
                  onChange={e => setEditing({...editing, description: e.target.value})}
                  className="w-full h-24"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-2">Status</label>
                <select 
                  value={editing.status} 
                  onChange={e => setEditing({...editing, status: e.target.value})}
                  className="w-full"
                >
                  <option value="coming_soon">Coming Soon</option>
                  <option value="active">Active (Live)</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 btn btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn btn-primary"><Check className="w-4 h-4 mr-2"/> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
