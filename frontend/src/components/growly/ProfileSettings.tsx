'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Loader2 } from 'lucide-react';

interface ProfileForm {
  name: string;
  age: string;
  study_level: string;
  stream: string;
  course: string;
  target_goal: string;
}

const EMPTY_FORM: ProfileForm = { name: '', age: '', study_level: '', stream: '', course: '', target_goal: '' };

export function ProfileSettings() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const api = () => axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  useEffect(() => {
    api().get('/api/auth/me')
      .then(({ data }) => {
        const u = data.user;
        setForm({
          name: u.name ?? '',
          age: u.age != null ? String(u.age) : '',
          study_level: u.study_level ?? '',
          stream: u.stream ?? '',
          course: u.course ?? '',
          target_goal: u.target_goal ?? '',
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        age: form.age === '' ? null : Number(form.age),
        study_level: form.study_level === '' ? null : form.study_level,
        stream: form.stream,
        course: form.course,
        target_goal: form.target_goal,
      };
      const { data } = await api().patch('/api/auth/me', payload);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-growly-blue" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-xl bg-white border border-gray-100 rounded-xl p-6">
      <h3 className="text-[15px] font-semibold text-growly-ink mb-1">Profile</h3>
      <p className="text-[13px] text-growly-muted mb-5">
        Keep your details up to date — we use this to recommend the right exams for you.
      </p>

      {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg mb-4">{error}</div>}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-500/10 p-3 rounded-lg mb-4">
          <Check size={14} /> Profile updated.
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-growly-muted block mb-1">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-growly-muted block mb-1">Age</label>
          <input
            type="number"
            min={5}
            max={100}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-growly-muted block mb-1">Study Status</label>
          <select
            value={form.study_level}
            onChange={(e) => setForm({ ...form, study_level: e.target.value })}
            className="w-full"
          >
            <option value="">Select...</option>
            <option value="school">School</option>
            <option value="undergrad">Undergraduate</option>
            <option value="postgrad">Postgraduate</option>
            <option value="working">Working Professional</option>
            <option value="other">Other</option>
          </select>
        </div>

        {(form.study_level === 'undergrad' || form.study_level === 'postgrad') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-growly-muted block mb-1">Stream</label>
              <input
                type="text"
                placeholder="e.g. Engineering"
                value={form.stream}
                onChange={(e) => setForm({ ...form, stream: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-growly-muted block mb-1">Course</label>
              <input
                type="text"
                placeholder="e.g. B.Tech"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-growly-muted block mb-1">Target Exam / Goal</label>
          <input
            type="text"
            placeholder="e.g. UPSC CSE, JEE Main, Bank PO"
            value={form.target_goal}
            onChange={(e) => setForm({ ...form, target_goal: e.target.value })}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 text-[13px] font-semibold bg-growly-blue hover:bg-growly-blue/90 disabled:opacity-50 text-white rounded-xl px-4 py-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
