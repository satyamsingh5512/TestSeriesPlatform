'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Clock, Zap, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function FeaturePage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const [feature, setFeature] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch from public features endpoint
    const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' });
    api.get('/api/features').then(r => {
      const f = r.data.features?.find((x: any) => x.feature_key === key);
      setFeature(f || { title: 'Feature Not Found', description: 'This module is unavailable.', status: 'hidden' });
    }).finally(() => setLoading(false));
  }, [key]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono animate-pulseText text-muted">Loading Module...</div>;

  const isComingSoon = feature?.status === 'coming_soon';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] animate-fadeIn p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/dashboard" className="text-sm font-semibold text-muted hover:text-primary flex items-center gap-2 w-max">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="panel p-8 md:p-16 text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-[var(--bg-panel)] to-[var(--bg-base)]">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

          {isComingSoon && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-4">
              <Clock className="w-3 h-3" /> Coming Soon
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--text-highlight)] tracking-tight">
            {feature?.title}
          </h1>
          
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            {feature?.description}
          </p>

          {isComingSoon ? (
            <div className="pt-8">
              <button className="btn btn-primary h-12 px-8 rounded-full shadow-glow disabled:opacity-50" disabled>
                Notify Me When Live
              </button>
            </div>
          ) : (
            <div className="pt-8">
              <button className="btn btn-primary h-12 px-8 rounded-full shadow-glow">
                Access Now <Zap className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>

        {/* Feature specific dynamic rendering can go here later based on feature.metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="panel p-6 bg-[var(--bg-panel)] border-none">
            <Star className="w-6 h-6 text-accent mb-4" />
            <h3 className="font-semibold text-[var(--text-highlight)] mb-2">Premium Quality</h3>
            <p className="text-sm text-[var(--text-muted)]">Content curated by top educators and industry experts.</p>
          </div>
          <div className="panel p-6 bg-[var(--bg-panel)] border-none">
            <Zap className="w-6 h-6 text-accent mb-4" />
            <h3 className="font-semibold text-[var(--text-highlight)] mb-2">Performance Optimized</h3>
            <p className="text-sm text-[var(--text-muted)]">Lightning fast delivery with our edge network.</p>
          </div>
          <div className="panel p-6 bg-[var(--bg-panel)] border-none">
            <ShieldCheck className="w-6 h-6 text-accent mb-4" />
            <h3 className="font-semibold text-[var(--text-highlight)] mb-2">Secure Platform</h3>
            <p className="text-sm text-[var(--text-muted)]">State-of-the-art proctoring and content protection.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
