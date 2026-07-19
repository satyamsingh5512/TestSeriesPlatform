import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
        <div className="inline-flex bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-8 border border-indigo-100">
          DPDP Act 2023 Compliant
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-left">
          <h2 className="text-xl font-bold mb-4">1. Data Collection & Consent</h2>
          <p className="text-slate-600 mb-6 text-sm">We strictly adhere to the Digital Personal Data Protection (DPDP) Act. All data collection requires explicit, verifiable consent.</p>
          <h2 className="text-xl font-bold mb-4">2. Proctoring Data</h2>
          <p className="text-slate-600 mb-6 text-sm">Camera feeds and browser activity are monitored only during active exam attempts and are automatically purged after 7 days in accordance with our retention policy.</p>
          <h2 className="text-xl font-bold mb-4">3. Right to Erasure</h2>
          <p className="text-slate-600 text-sm">Users have the complete right to revoke consent and request data erasure via their account settings.</p>
        </div>
      </div>
    </div>
  );
}