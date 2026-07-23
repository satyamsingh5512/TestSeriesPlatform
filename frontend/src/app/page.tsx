'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BrainCircuit, Globe, Zap, ShieldCheck, Box, 
  Activity, CheckCircle2, Lock, Users, Terminal, Sparkles, Sun, Moon
} from 'lucide-react';
import { LoginModal, RegisterModal, ForgotPasswordModal, ResetPasswordModal } from '@/components/auth/AuthModals';
import { useTenant } from '@/components/TenantProvider';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { BentoItem } from '@/components/ui/BentoItem';

// Animation settings matching the design system guidelines
const easeOut = [0.16, 1, 0.3, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

function LandingPageContent() {
  const [modal, setModal] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'integrity' | 'offline'>('telemetry');
  
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const brandName = tenant?.name || "ExamForge";

  // Check initial theme state
  useEffect(() => {
    const isDark = document.body.classList.contains('dark-theme');
    setTheme(isDark ? 'dark' : 'light');
    
    const auth = searchParams.get('auth');
    if (auth === 'login') setModal('login');
    if (auth === 'register') setModal('register');
  }, [searchParams]);

  // Toggle theme utility
  const toggleTheme = () => {
    if (theme === 'light') {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  const openModal = (type: 'login' | 'register') => setModal(type);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] font-sans text-[var(--text-primary)] relative overflow-hidden transition-colors duration-300 selection:bg-accent selection:text-white">
      {/* Radial Glow Ambient Lights */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-accent-secondary/5 blur-[120px] pointer-events-none -z-10" />

      {/* Auth Modals */}
      <LoginModal isOpen={modal === 'login'} onClose={() => setModal(null)} onSwitch={() => setModal('register')} onForgotPassword={() => setModal('forgot-password')} />
      <RegisterModal isOpen={modal === 'register'} onClose={() => setModal(null)} onSwitch={() => setModal('login')} />
      <ForgotPasswordModal isOpen={modal === 'forgot-password'} onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} onSwitchToReset={(email: any) => { setResetEmail(email); setModal('reset-password'); }} />
      <ResetPasswordModal isOpen={modal === 'reset-password'} onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} initialEmail={resetEmail} />

      {/* Navigation Bar */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg-panel)]/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer transition-opacity hover:opacity-85">
              <AnimatedLogo className="h-7 w-7 text-[var(--text-primary)]" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#infrastructure" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Infrastructure</Link>
            <Link href="#telemetry-tabs" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Simulations</Link>
            <Link href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-panel-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button 
              onClick={() => openModal('login')} 
              className="hidden sm:inline-block px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={() => openModal('register')} 
              className="bg-gradient-to-r from-accent to-accent-secondary hover:brightness-110 text-white px-5 py-2 rounded-xl transition-all duration-300 shadow-accent hover:shadow-accent-lg active:scale-[0.98] -translate-y-0.5 hover:-translate-y-1"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            
            {/* Left side info */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-start text-left"
            >
              {/* Section Label Badges */}
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 mb-8"
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
                  System Status: Active
                </span>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-normal text-[var(--text-primary)] leading-[1.08] mb-8 tracking-tight"
              >
                High-fidelity examination{' '}
                <span className="relative inline-block">
                  <span className="gradient-text">infrastructure.</span>
                  <span className="gradient-underline" />
                </span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-xl font-normal leading-relaxed"
              >
                Execute high-stakes assessments with deterministic precision. Utilizing multimodal IRT analytics and local-first offline state reconciliation.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <button 
                  onClick={() => openModal('register')} 
                  className="bg-gradient-to-r from-accent to-accent-secondary hover:brightness-110 text-white font-medium text-sm h-12 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-accent hover:shadow-accent-lg -translate-y-0.5 hover:-translate-y-1 active:scale-[0.98]"
                >
                  Start Execution 
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <Link 
                  href="#infrastructure" 
                  className="border border-[var(--border)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-hover)] text-[var(--text-primary)] font-medium text-sm h-12 px-8 rounded-xl transition-all duration-300 flex items-center justify-center hover:border-accent/30"
                >
                  Review Infrastructure
                </Link>
              </motion.div>
            </motion.div>

            {/* Right side animated graphics */}
            <div className="relative w-full aspect-square max-w-[450px] mx-auto lg:max-w-none flex items-center justify-center">
              {/* Radial gradient background behind shapes */}
              <div className="absolute w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />

              {/* Infinite Rotating Outer Ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 50, ease: "linear", repeat: Infinity }}
                className="absolute w-[80%] h-[80%] border border-dashed border-[var(--text-muted)]/20 rounded-full flex items-center justify-center pointer-events-none"
              />

              {/* Generative Abstract Composites */}
              <div className="relative w-[70%] h-[70%] flex items-center justify-center">
                {/* Visual Dot Grid Decorative elements */}
                <div className="absolute top-4 left-4 grid grid-cols-3 gap-2 opacity-30">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
                  ))}
                </div>

                {/* Floating Card 1: Active Proctor Telemetry */}
                <motion.div 
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
                  className="absolute -top-4 -left-6 z-10 w-[240px] struct-panel p-5 bg-[var(--bg-panel)]/90 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-wider text-accent uppercase">Telemetry Stream</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                  </div>
                  <div className="h-1 bg-[var(--border)] rounded-full mb-3 overflow-hidden">
                    <motion.div 
                      animate={{ width: ["30%", "85%", "55%", "90%", "30%"] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-accent to-accent-secondary"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">IRT Focus Vector:</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">Nominal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Blink Interval:</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">1.28s</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Card 2: State Sync Telemetry */}
                <motion.div 
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                  className="absolute -bottom-6 -right-6 z-10 w-[220px] struct-panel p-5 bg-[var(--bg-panel)]/90 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-accent animate-pulse" />
                    <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Offline Buffer</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
                    0.0ms <span className="text-xs text-[var(--text-muted)] font-sans font-normal">Lag</span>
                  </div>
                  <div className="text-[10px] text-success flex items-center gap-1 mt-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Fully Synced
                  </div>
                </motion.div>

                {/* Central solid geometric accent with shadow */}
                <div className="w-[120px] h-[120px] bg-gradient-to-tr from-accent to-accent-secondary rounded-3xl shadow-accent rotate-12 flex items-center justify-center">
                  <Box className="w-10 h-10 text-white -rotate-12" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section (Inverted Contrast / Dark Section with Dot Texture) */}
        <section className="bg-[#0B0F19] text-white relative overflow-hidden py-24 md:py-32">
          {/* Dot Grid Background Texture */}
          <div className="absolute inset-0 dot-pattern pointer-events-none opacity-40" />
          
          {/* Radial ambient background light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[150px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              <div>
                <div className="font-display text-5xl md:text-6xl text-white mb-2">99.99%</div>
                <div className="text-sm font-mono uppercase tracking-wider text-slate-400">System SLA Uptime</div>
              </div>
              <div>
                <div className="font-display text-5xl md:text-6xl text-white mb-2">0.0ms</div>
                <div className="text-sm font-mono uppercase tracking-wider text-slate-400">Telemetry Latency</div>
              </div>
              <div>
                <div className="font-display text-5xl md:text-6xl text-white mb-2">50M+</div>
                <div className="text-sm font-mono uppercase tracking-wider text-slate-400">Assessments Run</div>
              </div>
              <div>
                <div className="font-display text-5xl md:text-6xl text-white mb-2">100%</div>
                <div className="text-sm font-mono uppercase tracking-wider text-slate-400">Strict Crypt Sync</div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Feature Telemetry Showcase */}
        <section id="telemetry-tabs" className="max-w-6xl mx-auto px-6 py-28 md:py-36">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Simulation Sandbox</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display text-[var(--text-primary)] max-w-2xl mb-4">
              Real-time monitoring telemetry.
            </h2>
            <p className="text-[var(--text-muted)] max-w-lg">
              Explore how the platform visualizes proctor integrity streams and local state synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-12 items-start">
            {/* Tab navigation */}
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-none w-full">
              <button 
                onClick={() => setActiveTab('telemetry')}
                className={`flex-1 text-left px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 border whitespace-nowrap ${activeTab === 'telemetry' ? 'bg-gradient-to-r from-accent to-accent-secondary text-white border-transparent shadow-md shadow-accent/20' : 'bg-[var(--bg-panel)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(0,82,255,0.2)]'}`}
              >
                Telemetry Stream
              </button>
              <button 
                onClick={() => setActiveTab('integrity')}
                className={`flex-1 text-left px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 border whitespace-nowrap ${activeTab === 'integrity' ? 'bg-gradient-to-r from-accent to-accent-secondary text-white border-transparent shadow-md shadow-accent/20' : 'bg-[var(--bg-panel)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(0,82,255,0.2)]'}`}
              >
                Identity Validation
              </button>
              <button 
                onClick={() => setActiveTab('offline')}
                className={`flex-1 text-left px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 border whitespace-nowrap ${activeTab === 'offline' ? 'bg-gradient-to-r from-accent to-accent-secondary text-white border-transparent shadow-md shadow-accent/20' : 'bg-[var(--bg-panel)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(0,82,255,0.2)]'}`}
              >
                Local Reconciliation
              </button>
            </div>

            {/* Tab Content Display */}
            <div className="struct-panel p-8 bg-[var(--bg-panel)] min-h-[350px] flex flex-col justify-between relative overflow-hidden">
              {/* Overlay grid lines for tech texture */}
              <div className="absolute inset-0 light-dot-pattern pointer-events-none opacity-20" />
              
              <AnimatePresence mode="wait">
                {activeTab === 'telemetry' && (
                  <motion.div
                    key="telemetry"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 relative z-10"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-lg">Active Telemetry Monitor</h4>
                      </div>
                      <span className="text-xs font-mono bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                        Telemetry Nominal
                      </span>
                    </div>

                    <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                      Continuous monitoring algorithm checking gaze patterns, latency metrics, and background process integrity. State adjustments are calculated locally on device.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border)]">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">Gaze Focus Index</div>
                        <div className="text-xl font-semibold font-mono text-[var(--text-primary)]">98.4% Accuracy</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">Heartbeat Frequency</div>
                        <div className="text-xl font-semibold font-mono text-[var(--text-primary)]">1.0 Hz (Continuous)</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">Gaze Latency Matrix</div>
                        <div className="text-xl font-semibold font-mono text-accent">14ms Delta</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'integrity' && (
                  <motion.div
                    key="integrity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 relative z-10"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-lg">Identity Validation Engine</h4>
                      </div>
                      <span className="text-xs font-mono bg-accent/10 text-accent px-3 py-1 rounded-full">
                        Secure Sandbox
                      </span>
                    </div>

                    <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                      Encrypted local biometrics validation runs every 30 seconds to verify user identity. Biometric vectors are transformed and matched without leaking raw image data outside client environment.
                    </p>

                    <div className="bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border)] flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">User Vector Match</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Verified against genesis biometric handshake</div>
                        </div>
                      </div>
                      <span className="font-mono text-sm text-success font-semibold">100% Cryptographic Match</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'offline' && (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 relative z-10"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-lg">Local Database Sync Queue</h4>
                      </div>
                      <span className="text-xs font-mono bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full">
                        Local-First Enabled
                      </span>
                    </div>

                    <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                      Maintains absolute exam stability even during total network blackouts. Exam state updates write directly to a local transaction log and replay progressively as connectivity resolves.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-[var(--border)] bg-[var(--bg-base)] p-4 rounded-xl">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] mb-1">Queue Transaction Count</div>
                        <div className="text-lg font-bold font-mono text-[var(--text-primary)]">0 Pending</div>
                      </div>
                      <div className="border border-[var(--border)] bg-[var(--bg-base)] p-4 rounded-xl">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] mb-1">State Verification Hash</div>
                        <div className="text-xs font-mono text-accent truncate">sha256:4d7cff...0052ff</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Feature Grid (Modern Bento Layout with Minimalist Panels) */}
        <section id="infrastructure" className="max-w-6xl mx-auto px-6 py-28 md:py-36 border-t border-[var(--border)]">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {/* Section Pill Badge */}
              <div className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 mb-6">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Core Architecture</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display text-[var(--text-primary)] tracking-tight">
                Designed for absolute reliability.
              </h2>
            </div>
            <p className="text-[var(--text-muted)] max-w-sm text-sm md:text-base leading-relaxed">
              Every system component is engineered for extreme situations where latency, failure, or security breach is not tolerable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BentoItem colSpan={1} className="hoverEffect">
              {/* Icon Container with Signature Gradient */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-accent-secondary flex items-center justify-center text-white mb-8 shadow-accent">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multimodal Analysis</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                IRT-based assessment engines metrics evaluation. Calculates latency anomalies, cognitive load indices, and interaction validation arrays concurrently.
              </p>
            </BentoItem>
            
            <BentoItem colSpan={1} className="hoverEffect">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-accent-secondary flex items-center justify-center text-white mb-8 shadow-accent">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Offline Determinism</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                Local-first sync protocols save question answers locally, buffering offline state records seamlessly and re-syncing upon server recovery.
              </p>
            </BentoItem>

            <BentoItem colSpan={1} className="hoverEffect">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-accent-secondary flex items-center justify-center text-white mb-8 shadow-accent">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Strict Integrity</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                Integrity layers restricting virtual screens, focus shifts, unauthorized audio monitors, and dynamic environment telemetry variables.
              </p>
            </BentoItem>
          </div>
        </section>

        {/* Pricing/Access Tier Section with elevated featured card */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-28 md:py-36 border-t border-[var(--border)]">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Access Models</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display text-[var(--text-primary)] mb-4">
              Transparent, scale-ready pricing.
            </h2>
            <p className="text-[var(--text-muted)] max-w-md">
              Start testing with local developer credentials, or provision distributed enterprise grids.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Tier 1: Sandbox */}
            <div className="struct-panel p-8 bg-[var(--bg-panel)] flex flex-col justify-between hoverEffect">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Developer Sandbox</span>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mt-4 mb-2">$0</div>
                <p className="text-xs text-[var(--text-muted)] mb-8">Free access for local application testing & staging.</p>
                <ul className="space-y-3.5 text-xs text-[var(--text-primary)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Up to 100 mock attempts/mo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Sandbox API endpoints
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Standard developer telemetry
                  </li>
                </ul>
              </div>
              <button onClick={() => openModal('register')} className="w-full border border-[var(--border)] hover:bg-[var(--bg-panel-hover)] py-3 rounded-xl text-xs font-medium mt-8 transition-colors">
                Initialize Sandbox
              </button>
            </div>

            {/* Tier 2: Pro (Elevated Featured Card with 2px Gradient Border) */}
            <div className="rounded-2xl bg-gradient-to-br from-accent via-accent-secondary to-accent p-[2px] shadow-accent hover:shadow-accent-lg transition-shadow duration-300">
              <div className="h-full w-full rounded-[calc(1rem-2px)] bg-[var(--bg-panel)] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">Production Grid</span>
                    <span className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">Popular</span>
                  </div>
                  <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mt-4 mb-2">$149<span className="text-sm font-sans font-normal text-[var(--text-muted)]">/mo</span></div>
                  <p className="text-xs text-[var(--text-muted)] mb-8">Fully functional proctoring & telemetry services for growing institutions.</p>
                  <ul className="space-y-3.5 text-xs text-[var(--text-primary)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited exam runs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" /> Biometric Identity vectors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" /> Gaze-telemetry anomalies API
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" /> 24/7 SLA assurance support
                    </li>
                  </ul>
                </div>
                <button onClick={() => openModal('register')} className="w-full bg-gradient-to-r from-accent to-accent-secondary text-white py-3 rounded-xl text-xs font-medium mt-8 shadow-sm hover:brightness-110 active:scale-[0.98] transition-all">
                  Access Production Grid
                </button>
              </div>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="struct-panel p-8 bg-[var(--bg-panel)] flex flex-col justify-between hoverEffect">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Distributed Enterprise</span>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mt-4 mb-2">Custom</div>
                <p className="text-xs text-[var(--text-muted)] mb-8">Isolated Kubernetes execution nodes with offline sync capabilities.</p>
                <ul className="space-y-3.5 text-xs text-[var(--text-primary)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Dedicated hosting infrastructure
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Custom analytics algorithms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> White-label domain proxying
                  </li>
                </ul>
              </div>
              <Link href="/contact" className="w-full border border-[var(--border)] hover:bg-[var(--bg-panel-hover)] py-3 rounded-xl text-xs font-medium mt-8 transition-colors flex items-center justify-center">
                Contact Infrastructure
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA (Inverted Dark Section with Input and Glow) */}
        <section className="bg-[#0B0F19] text-white relative overflow-hidden py-24 md:py-32">
          {/* Dot pattern background */}
          <div className="absolute inset-0 dot-pattern pointer-events-none opacity-40" />
          
          {/* Corner Glow background */}
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-secondary/15 blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-display text-white mb-6 leading-tight max-w-2xl">
              Ready to deploy strict security bounds?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl">
              Establish a secure examination sandbox environment on LuminaEdu in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <input 
                type="email" 
                placeholder="Enter enterprise email" 
                className="flex-1 px-5 h-12 bg-slate-900/60 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm text-white placeholder-slate-500" 
              />
              <button 
                onClick={() => openModal('register')} 
                className="bg-gradient-to-r from-accent to-accent-secondary hover:brightness-110 text-white font-medium text-sm h-12 px-6 rounded-xl transition-all duration-300 shadow-accent flex items-center justify-center gap-1"
              >
                Get Started <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Styled Modern Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-panel)] pt-20 pb-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <AnimatedLogo className="mb-6 opacity-60 text-[var(--text-primary)]" />
              <p className="text-[var(--text-muted)] font-mono text-xs leading-relaxed max-w-sm">
                Engineered for strict architectural bounds. Designed for absolute operational utility.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-4 text-[var(--text-primary)]">Platform</h4>
              <ul className="space-y-3 text-[var(--text-muted)] text-sm">
                <li><Link href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing model</Link></li>
                <li><button onClick={() => openModal('login')} className="hover:text-[var(--text-primary)] transition-colors">Developer Portal</button></li>
                <li><button onClick={() => openModal('register')} className="hover:text-[var(--text-primary)] transition-colors">Admin Dashboard</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-[var(--text-primary)]">Legal & Compliance</h4>
              <ul className="space-y-3 text-[var(--text-muted)] text-sm">
                <li><Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">Compliance matrix</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">Technical Support</Link></li>
                <li><Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">DPDP Policy rules</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[var(--text-muted)] font-mono text-xs">
            <p>© {new Date().getFullYear()} {brandName} Systems. Deterministic runtime.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
