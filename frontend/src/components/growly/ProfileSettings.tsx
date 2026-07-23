'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, ChevronRight, Loader2, Target } from 'lucide-react';

interface ProfileForm {
  name: string;
  age: string;
  study_level: string;
  stream: string;
  course: string;
  target_goal: string;
}

interface ProfileSettingsProps {
  onProfileSaved?: (user: any) => void;
}

const emptyForm: ProfileForm = { name: '', age: '', study_level: '', stream: '', course: '', target_goal: '' };
const fieldClass = 'w-full rounded-xl border border-white/80 bg-white/60 px-3.5 py-2.5 backdrop-blur-sm text-sm text-[#1A2337] outline-none transition placeholder:text-[#A5ADBC] hover:border-[#C8CFDC] focus:border-[#6F84C2] focus:ring-4 focus:ring-[#DDE5FA]';

export function ProfileSettings({ onProfileSaved }: ProfileSettingsProps) {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
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
        const user = data.user;
        setForm({
          name: user.name ?? '',
          age: user.age != null ? String(user.age) : '',
          study_level: user.study_level ?? '',
          stream: user.stream ?? '',
          course: user.course ?? '',
          target_goal: user.target_goal ?? '',
        });
      })
      .catch(() => setError('Your profile could not be loaded. Refresh the page and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof ProfileForm, nextValue: string) => setForm((current) => ({ ...current, [key]: nextValue }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        age: form.age === '' ? null : Number(form.age),
        study_level: form.study_level || null,
        stream: form.stream,
        course: form.course,
        target_goal: form.target_goal,
      };
      const { data } = await api().patch('/api/auth/me', payload);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data.user }));
      onProfileSaved?.(data.user);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Your changes could not be saved. Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="glass-surface max-w-3xl animate-pulse rounded-2xl p-6"><div className="h-6 w-44 rounded bg-[#E9ECF2]" /><div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="h-12 rounded-xl bg-[#EDF0F4]" /><div className="h-12 rounded-xl bg-[#EDF0F4]" /></div></div>;
  }

  return (
    <div className="glass-surface max-w-3xl overflow-hidden rounded-2xl">
      <div className="border-b border-white/65 bg-white/28 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#1C2D63] text-[#F1C567]"><Target size={18} /></span>
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.025em] text-[#172036]">Your study profile</h3>
            <p className="mt-1 text-sm leading-5 text-[#727C90]">Keep this current so we can place the most relevant practice in your library.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="p-5 sm:p-6">
        {error && <div className="mb-5 rounded-xl border border-[#F1C9C4] bg-[#FFF4F2] px-4 py-3 text-sm text-[#A0443A]">{error}</div>}
        {saved && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#C9E7D6] bg-[#F0FAF4] px-4 py-3 text-sm font-medium text-[#246C47]"><Check size={15} /> Your profile is up to date.</div>}

        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6F788A]">About you</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1.5fr_.5fr]">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#4E586C]">Full name</span><input type="text" required value={form.name} onChange={(event) => update('name', event.target.value)} className={fieldClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#4E586C]">Age</span><input type="number" min={5} max={100} value={form.age} onChange={(event) => update('age', event.target.value)} className={fieldClass} /></label>
          </div>
        </section>

        <section className="mt-7 border-t border-[#EEF0F4] pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6F788A]">Academic context</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#4E586C]">Study status</span><select value={form.study_level} onChange={(event) => update('study_level', event.target.value)} className={fieldClass}><option value="">Select your current stage</option><option value="school">School</option><option value="undergrad">Undergraduate</option><option value="postgrad">Postgraduate</option><option value="working">Working professional</option><option value="other">Other</option></select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#4E586C]">Stream</span><input type="text" placeholder="e.g. Engineering, Commerce" value={form.stream} onChange={(event) => update('stream', event.target.value)} className={fieldClass} /></label>
            <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#4E586C]">Course or degree</span><input type="text" placeholder="e.g. B.Tech Computer Science" value={form.course} onChange={(event) => update('course', event.target.value)} className={fieldClass} /></label>
          </div>
        </section>

        <section className="mt-7 border-t border-[#EEF0F4] pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6F788A]">Preparation target</p>
          <label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold text-[#4E586C]">Target exam or goal</span><input type="text" placeholder="e.g. UPSC CSE, JEE Main, Bank PO" value={form.target_goal} onChange={(event) => update('target_goal', event.target.value)} className={fieldClass} /><span className="mt-2 block text-[11px] leading-4 text-[#7A8395]">We use your target alongside your study profile to order recommended practice.</span></label>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F4] pt-5">
          <p className="text-xs text-[#788196]">Changes apply to future recommendations.</p>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1C2D63] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#2A438E] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#9DB0E8]">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{saving ? 'Saving changes' : 'Save profile'}<ChevronRight size={14} /></button>
        </div>
      </form>
    </div>
  );
}
