import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">About Us</h1>
        <p className="text-slate-500 mb-8">We are building the next generation of EdTech for the Indian market.</p>
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-left">
          <p className="text-slate-700 leading-relaxed mb-4">Our mission is to democratize high-quality education and testing through AI and intelligent platform design.</p>
          <p className="text-slate-700 leading-relaxed">This platform ensures secure, adaptive, and highly scalable exam preparation.</p>
        </div>
      </div>
    </div>
  );
}