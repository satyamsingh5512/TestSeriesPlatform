'use client';
import { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConsentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDigiLockerLogin = async () => {
    setLoading(true);
    try {
      const api = axios.create({ 
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });
      
      const { data } = await api.get('/api/consent/digilocker/login');
      // Redirect to the mock DigiLocker OAuth flow
      window.location.href = data.redirect_url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">Consent Required</h2>
            <p className="text-slate-500 text-sm text-center mb-8 font-medium">
              As per the DPDP Act 2023, verifiable consent is required before accessing assessments. 
              If you are under 18, a parent or guardian must authorize your account.
            </p>
            
            <div className="space-y-4 mb-8">
               <div className="flex items-start gap-3 text-sm text-slate-600">
                 <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                 <span>Fast, secure verification via DigiLocker.</span>
               </div>
               <div className="flex items-start gap-3 text-sm text-slate-600">
                 <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                 <span>We do not store your Aadhaar details.</span>
               </div>
            </div>

            <button 
              onClick={handleDigiLockerLogin}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Verify via DigiLocker'} <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-full mt-4 text-slate-500 font-semibold text-sm hover:text-slate-900">
              Cancel & Go Back
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
