'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '@/components/TenantProvider';

const DEFAULT_TENANT_ID = '2375cd52-f3da-46e2-9e6e-58eddb9c9878';

export function LoginModal({ isOpen, onClose, onSwitch, onForgotPassword }: any) {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [activeSessionPrompt, setActiveSessionPrompt] = useState<{show: boolean, lastLoginAt: string | null}>({ show: false, lastLoginAt: null });
  
  const submit = async (e?: any, force_logout = false) => {
    if (e) e.preventDefault();
    setError('');
    setActiveSessionPrompt({ show: false, lastLoginAt: null });
    try {
      const payload = { ...form, force_logout };
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, payload);
      localStorage.setItem('token', data.token); 
      localStorage.setItem('user', JSON.stringify(data.user));
      // Role-based redirect
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        router.push('/admin/exams');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) { 
      if (err.response?.status === 409 && err.response?.data?.active_session_exists) {
        setActiveSessionPrompt({ show: true, lastLoginAt: err.response.data.last_login_at });
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.'); 
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="panel w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-highlight mb-6">Sign In</h2>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</div>}
            
            {activeSessionPrompt.show ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-600">
                  <p className="font-semibold mb-2">Already Logged In</p>
                  <p>This account is currently active on another device (last logged in: {new Date(activeSessionPrompt.lastLoginAt!).toLocaleString()}).</p>
                  <p className="mt-2 text-xs">Logging in here will securely log you out of all other sessions.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setActiveSessionPrompt({ show: false, lastLoginAt: null })} className="btn bg-panel hover:bg-panel-hover flex-1 text-muted">Cancel</button>
                  <button onClick={() => submit(null, true)} className="btn btn-primary flex-1 bg-yellow-600 hover:bg-yellow-700 text-white border-none">Log out others</button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => submit(e, false)} className="space-y-4">
                <div><label className="text-xs font-semibold text-muted block mb-1">Email</label><input type="email" required onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-muted block">Password</label>
                    <button type="button" onClick={onForgotPassword} className="text-[10px] font-bold text-blue-600 hover:underline" style={{ color: 'var(--primary, #2563eb)' }}>Forgot?</button>
                  </div>
                  <input type="password" required onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-full justify-center py-2.5" style={{ backgroundColor: 'var(--primary, #0f172a)' }}>Continue</button>
              </form>
            )}
            <p className="text-xs text-muted mt-6 text-center">New? <button onClick={onSwitch} className="text-accent hover:underline" style={{ color: 'var(--primary, #2563eb)' }}>Create account</button></p>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">✕</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function RegisterModal({ isOpen, onClose, onSwitch }: any) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { tenant } = useTenant();
  
  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/register`, { ...form, tenant_id: tenant?.id || DEFAULT_TENANT_ID });
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); router.push('/dashboard');
    } catch (err: any) { 
      setError(err.response?.data?.error || 'Registration failed. Please try again.'); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="panel w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-highlight mb-6">Create Account</h2>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="text-xs font-semibold text-muted block mb-1">Name</label><input type="text" required onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="text-xs font-semibold text-muted block mb-1">Email</label><input type="email" required onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="text-xs font-semibold text-muted block mb-1">Password</label><input type="password" required onChange={e => setForm({...form, password: e.target.value})} /></div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5" style={{ backgroundColor: 'var(--primary, #0f172a)' }}>Join</button>
            </form>
            <p className="text-xs text-muted mt-6 text-center">Member? <button onClick={onSwitch} className="text-accent hover:underline" style={{ color: 'var(--primary, #2563eb)' }}>Sign In</button></p>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">✕</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin, onSwitchToReset }: any) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { tenant } = useTenant();
  
  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/forgot-password`, { email, tenant_id: tenant?.id || DEFAULT_TENANT_ID });
      setSuccess(true);
      setTimeout(() => onSwitchToReset(email), 2000); // Auto-switch to reset modal
    } catch (err: any) { 
      setError(err.response?.data?.error || 'Failed to request reset. Please try again.'); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="panel w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-highlight mb-2">Reset Password</h2>
            <p className="text-xs text-muted mb-6">Enter your email and we'll send you an OTP.</p>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm mb-4 bg-green-500/10 p-3 rounded">OTP generated! Redirecting...</div>}
            
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full" />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5" style={{ backgroundColor: 'var(--primary, #0f172a)' }}>Send OTP</button>
            </form>
            <p className="text-xs text-muted mt-6 text-center">Remembered? <button onClick={onSwitchToLogin} className="text-accent hover:underline" style={{ color: 'var(--primary, #2563eb)' }}>Sign In</button></p>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">✕</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ResetPasswordModal({ isOpen, onClose, onSwitchToLogin, initialEmail }: any) {
  const [form, setForm] = useState({ email: initialEmail || '', otp: '', new_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { tenant } = useTenant();
  
  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/reset-password`, { ...form, tenant_id: tenant?.id || DEFAULT_TENANT_ID });
      setSuccess(true);
      setTimeout(() => onSwitchToLogin(), 2000); // Auto-switch to login modal
    } catch (err: any) { 
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.'); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="panel w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-highlight mb-2">New Password</h2>
            <p className="text-xs text-muted mb-6">Enter the OTP sent to your email and your new password.</p>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm mb-4 bg-green-500/10 p-3 rounded">Password reset successfully!</div>}
            
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">6-Digit OTP</label>
                <input type="text" maxLength={6} required value={form.otp} onChange={e => setForm({...form, otp: e.target.value})} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">New Password</label>
                <input type="password" required value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} className="w-full" />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5" style={{ backgroundColor: 'var(--primary, #0f172a)' }}>Reset Password</button>
            </form>
            <p className="text-xs text-muted mt-6 text-center"><button onClick={onSwitchToLogin} className="text-accent hover:underline" style={{ color: 'var(--primary, #2563eb)' }}>Back to Sign In</button></p>
            <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">✕</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
