import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Contact Us</h1>
        <p className="text-slate-500 mb-8">We would love to hear from you.</p>
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-700 mb-2"><strong>Email:</strong> support@luminaedu.com</p>
          <p className="text-slate-700"><strong>Phone:</strong> 1800-123-4567</p>
        </div>
      </div>
    </div>
  );
}