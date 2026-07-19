import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Please read these terms carefully before using the platform.</p>
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-left">
          <p className="text-slate-700 leading-relaxed text-sm mb-4">By accessing or using the platform, you agree to be bound by these Terms. The platform provides educational content, mock exams, and analytics.</p>
          <p className="text-slate-700 leading-relaxed text-sm">Any attempt to bypass the proctoring security measures or share copyrighted exam material will result in immediate termination of your account.</p>
        </div>
      </div>
    </div>
  );
}