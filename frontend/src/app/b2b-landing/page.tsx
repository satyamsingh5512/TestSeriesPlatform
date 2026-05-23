import { syne, manrope } from '../../lib/fonts';
import { cn } from '../../lib/utils';
import { NoiseOverlay } from '../../components/landing/NoiseOverlay';
import { ProceduralHeroGraphic } from '../../components/landing/ProceduralHeroGraphic';
import { BentoGrid } from '../../components/landing/BentoGrid';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ExamForge | Premium Test Series',
  description: 'The standard for competitive exam preparation. Built for top percentiles.',
};

export default function LandingPage() {
  return (
    <div className={cn(
      "min-h-screen bg-[#050505] text-white antialiased selection:bg-white selection:text-black overflow-x-hidden relative",
      syne.variable,
      manrope.variable,
      "font-body"
    )}>
      <NoiseOverlay />
      
      {/* Absolute strict grid overlay for brutalist feel */}
      <div className="pointer-events-none fixed inset-0 z-0 flex justify-center w-full max-w-[1400px] mx-auto opacity-[0.03]">
        <div className="w-px h-full bg-white" />
        <div className="flex-1" />
        <div className="w-px h-full bg-white" />
        <div className="flex-1 hidden md:block" />
        <div className="w-px h-full bg-white hidden md:block" />
        <div className="flex-1 hidden lg:block" />
        <div className="w-px h-full bg-white hidden lg:block" />
        <div className="flex-1" />
        <div className="w-px h-full bg-white" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-6 mix-blend-difference">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="font-display font-bold text-xl tracking-tighter uppercase flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm" />
            EXAMFORGE
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium tracking-tight">
            <Link href="#jee" className="hover:text-blue-400 transition-colors">JEE Mains & Adv</Link>
            <Link href="#neet" className="hover:text-blue-400 transition-colors">NEET</Link>
            <Link href="#bundles" className="hover:text-blue-400 transition-colors">Test Bundles</Link>
          </div>
          <Link href="/login" className="text-sm font-semibold tracking-tight border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors">
            Login
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen pt-32 pb-20 px-6 flex flex-col justify-center max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">
            
            <div className="lg:col-span-7 flex flex-col items-start z-10">
              <div className="inline-block border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-widest font-semibold mb-8 text-blue-400">
                Enrollment Open for 2027
              </div>
              <h1 className="font-display text-[12vw] sm:text-[110px] leading-[0.85] tracking-[-0.04em] font-bold uppercase mb-8 mix-blend-difference">
                Master <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-neutral-700">The Absolute</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-400 max-w-xl leading-relaxed tracking-tight mb-12 font-light">
                The most advanced test series platform for JEE, NEET, and Mains. Featuring adaptive mock tests, AI-driven analytics, and premium bundles designed for the top 1%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button className="bg-white text-black px-8 py-4 font-semibold tracking-tight uppercase text-sm hover:bg-neutral-200 transition-colors">
                  Explore Bundles
                </button>
                <button className="border border-white/20 text-white px-8 py-4 font-semibold tracking-tight uppercase text-sm hover:bg-white/5 transition-colors">
                  Take Free Mock Test
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative w-full">
               <ProceduralHeroGraphic />
            </div>
            
          </div>
        </section>

        {/* Marquee / Social Proof */}
        <section className="border-y border-white/10 overflow-hidden bg-[#050505] py-8">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap justify-between items-center gap-8 opacity-40 grayscale">
            <span className="font-display font-bold text-2xl tracking-tighter">JEE ADVANCED</span>
            <span className="font-display font-bold text-2xl tracking-tighter">JEE MAINS</span>
            <span className="font-display font-bold text-2xl tracking-tighter">NEET UG</span>
            <span className="font-display font-bold text-2xl tracking-tighter">BITSAT</span>
            <span className="font-display font-bold text-2xl tracking-tighter hidden md:block">CUET</span>
          </div>
        </section>

        {/* Features / Bento */}
        <section className="py-32 px-6 max-w-[1400px] mx-auto">
          <div className="mb-20 max-w-2xl">
            <h2 className="font-display text-4xl md:text-6xl tracking-tighter font-bold uppercase mb-6">
              Precision Preparation
            </h2>
            <p className="text-neutral-400 text-lg tracking-tight leading-relaxed">
              We eliminated variance in your preparation. Every mock test, every analysis, every percentile rank is processed with mathematical certainty to guarantee improvement.
            </p>
          </div>
          
          <BentoGrid />
        </section>

        {/* Procedural Data Flow Abstract */}
        <section className="py-32 border-t border-white/10 bg-[#0a0a0a] overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative aspect-square border border-white/10 p-8 flex flex-col justify-between overflow-hidden">
              {/* CSS Art: Animated analytics graph lines */}
              <div className="absolute inset-0 overflow-hidden opacity-30">
                 {/* Grid lines */}
                 <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100% 20%'}} />
                 
                 {/* Trend line */}
                 <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d="M0,80 Q20,70 40,60 T80,40 T120,20" vectorEffect="non-scaling-stroke" fill="none" stroke="#3b82f6" strokeWidth="2" />
                 </svg>
                 
                 <div className="w-32 h-32 border border-blue-500/50 absolute top-1/4 right-1/4 rounded-full animate-ping" style={{ animationDuration: '3s'}} />
                 <div className="w-16 h-16 bg-blue-500/20 absolute top-1/4 right-1/4 rounded-full blur-xl" />
              </div>
              <div className="text-xs uppercase tracking-widest text-blue-400 font-semibold z-10">Figure 01: Analytics</div>
              <div className="text-right text-xs uppercase tracking-widest text-neutral-500 font-semibold z-10">Percentile Projection</div>
            </div>
            
            <div>
              <h2 className="font-display text-4xl md:text-6xl tracking-tighter font-bold uppercase mb-8">
                Predictive <br/> Performance
              </h2>
              <p className="text-neutral-400 text-lg tracking-tight leading-relaxed mb-8">
                Beneath the surface lies a procedurally generated mesh of historical data. It anticipates your weaknesses, restructures your study plan, and ensures you hit your target rank.
              </p>
              <ul className="space-y-4 border-t border-white/10 pt-8">
                {['Item Response Theory (IRT) Scoring', 'Micro-topic weakness identification', 'All India comparative benchmarking'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-medium tracking-tight">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 px-6 max-w-[1400px] mx-auto text-center border-t border-white/10">
          <h2 className="font-display text-[8vw] md:text-9xl tracking-tighter font-bold uppercase mb-12">
            Dominate The Exam
          </h2>
          <button className="bg-white text-black px-12 py-6 font-bold tracking-widest uppercase text-lg hover:bg-neutral-200 transition-colors">
            View Pricing & Bundles
          </button>
        </section>
      </main>

      <footer className="border-t border-white/10 py-12 px-6 mix-blend-difference z-20 relative">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs uppercase tracking-widest font-semibold text-neutral-500">
          <div>© {new Date().getFullYear()} EXAMFORGE EDU INC.</div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
