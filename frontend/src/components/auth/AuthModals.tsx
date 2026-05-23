'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, BookOpen, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// For development: Default Demo Tenant ID
const DEFAULT_TENANT_ID = '2375cd52-f3da-46e2-9e6e-58eddb9c9878';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitch }: ModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [isForgot, setIsForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [otpForm, setOtpForm] = useState({ otp: '', new_password: '' });
  const [debugOtp, setDebugOtp] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`,
        form
      );
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/forgot-password`,
        { email: form.email, tenant_id: DEFAULT_TENANT_ID }
      );
      setSuccess('OTP generated!');
      if (data.debug_otp) setDebugOtp(data.debug_otp);
      setForgotStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/reset-password`,
        { 
          email: form.email, 
          tenant_id: DEFAULT_TENANT_ID,
          otp: otpForm.otp,
          new_password: otpForm.new_password
        }
      );
      setSuccess('Password reset successfully! Please log in.');
      setIsForgot(false);
      setForgotStep(1);
      setDebugOtp('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-6 md:p-12 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-[6px] pointer-events-auto" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[380px] bg-white border border-slate-200 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden pointer-events-auto"
          >
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-10">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                  {isForgot ? <KeyRound className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isForgot ? 'Reset Password' : 'Sign In'}
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  {isForgot ? 'Secure your account access' : 'Continue to ExamForge'}
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-xs font-bold mb-4">
                  {error}
                </div>
              )}
              {success && !error && (
                <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-green-600 text-xs font-bold mb-4">
                  {success}
                </div>
              )}

              {/* Debug OTP Display */}
              {debugOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-700 text-xs mb-4 flex justify-between items-center">
                  <span>Your temporary OTP is:</span>
                  <span className="font-mono font-black text-sm">{debugOtp}</span>
                </div>
              )}

              {/* Forgot Password Flow */}
              {isForgot ? (
                <div className="space-y-4">
                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotRequest} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                          placeholder="name@example.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold rounded-2xl py-4 mt-2 transition-all shadow-xl active:scale-[0.97]"
                      >
                        {loading ? 'Sending OTP...' : 'Generate OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">OTP</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpForm.otp}
                          onChange={e => setOtpForm(f => ({ ...f, otp: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-mono tracking-widest text-center text-lg"
                          placeholder="000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                        <input
                          type="password"
                          required
                          value={otpForm.new_password}
                          onChange={e => setOtpForm(f => ({ ...f, new_password: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                          placeholder="Minimum 8 characters"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold rounded-2xl py-4 mt-2 transition-all shadow-xl active:scale-[0.97]"
                      >
                        {loading ? 'Resetting...' : 'Update Password'}
                      </button>
                    </form>
                  )}
                  <button 
                    onClick={() => { setIsForgot(false); setForgotStep(1); setDebugOtp(''); }}
                    className="w-full text-slate-500 text-xs font-bold hover:text-slate-900 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </button>
                </div>
              ) : (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                      <button 
                        type="button"
                        onClick={() => setIsForgot(true)}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-2xl py-4 mt-4 transition-all shadow-xl active:scale-[0.97]"
                  >
                    {loading ? 'Sign in...' : 'Sign in'}
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  {isForgot ? "Remembered your password?" : "New here?"}{' '}
                  <button onClick={onSwitch} className="text-blue-600 font-bold hover:underline">
                    {isForgot ? "Sign In" : "Create Account"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function RegisterModal({ isOpen, onClose, onSwitch }: ModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/register`,
        { ...form, tenant_id: DEFAULT_TENANT_ID }
      );
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-6 md:p-12 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-[6px] pointer-events-auto" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[380px] bg-white border border-slate-200 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden pointer-events-auto"
          >
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-10">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign Up</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Join ExamForge today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-red-600 text-xs font-bold">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                    placeholder="Ravi Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl py-4 mt-4 transition-all shadow-xl active:scale-[0.97]"
                >
                  {loading ? 'Join...' : 'Join ExamForge'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  Already a member?{' '}
                  <button onClick={onSwitch} className="text-blue-600 font-bold hover:underline">Sign In</button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
