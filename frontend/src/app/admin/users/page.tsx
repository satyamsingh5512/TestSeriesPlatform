'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Shield, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    apiClient().get('/api/admin/users')
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await apiClient().put(`/api/admin/users/${editingUser.id}`, { name: formData.name, email: formData.email, role: formData.role });
      } else {
        await apiClient().post('/api/admin/users', formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient().delete(`/api/admin/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const openModal = (user: any = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    } else {
      setFormData({ name: '', email: '', password: '', role: 'student' });
    }
    setModalOpen(true);
  };

  if (loading) return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-panel-hover rounded w-1/4"></div>
        <div className="h-10 bg-panel-hover rounded w-32"></div>
      </div>
      <div className="h-[400px] bg-panel-hover rounded-xl border border-themeBorder"></div>
    </div>
  );

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto animate-fadeIn space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-highlight tracking-tight">User Management</h1>
          <p className="text-sm text-muted mt-1">Control access, roles, and profiles within your tenant.</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary h-10 px-6 shadow-glow-hover">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </button>
      </header>

      <div className="panel overflow-hidden border-themeBorder">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-panel-hover border-b border-themeBorder text-xs uppercase tracking-widest text-muted font-semibold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Consent</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-themeBorder">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-panel-hover transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-panel flex items-center justify-center border border-themeBorder text-muted">
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-highlight">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${u.role === 'admin' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-panel text-muted border border-themeBorder'}`}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.consent_verified ? (
                    <span className="text-xs text-green-500 font-semibold bg-green-500/10 px-2 py-1 rounded">Verified</span>
                  ) : (
                    <span className="text-xs text-yellow-500 font-semibold bg-yellow-500/10 px-2 py-1 rounded">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(u)} className="btn bg-panel hover:bg-panel-hover border-themeBorder px-3 h-8 text-muted hover:text-highlight">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="btn bg-panel hover:bg-red-500/10 border-themeBorder hover:border-red-500/30 px-3 h-8 text-muted hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="panel w-full max-w-md p-6 bg-[var(--bg-base)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-highlight">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-muted hover:text-highlight"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full" placeholder="john@example.com" />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Initial Password</label>
                    <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full" placeholder="••••••••" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full">
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn bg-panel hover:bg-panel-hover text-muted">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
