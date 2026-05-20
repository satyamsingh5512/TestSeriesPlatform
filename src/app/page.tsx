'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, CheckCircle2, Star, Users, FileText, PlayCircle, Trophy, BookOpen, Calculator, Stethoscope, Building2, Briefcase, GraduationCap, ArrowRight, Award } from 'lucide-react';
import { LoginModal, RegisterModal } from '@/components/auth/AuthModals';

function LandingPageContent() {
  const [modal, setModal] = useState<'login' | 'register' | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'login') setModal('login');
    if (auth === 'register') setModal('register');
  }, [searchParams]);

  const openModal = (type: 'login' | 'register', e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTriggerRect(rect);
    setModal(type);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Early Bird Moving Banner - Perfectly Infinite & Sticky */}
      <div className="bg-slate-900 text-white py-2.5 overflow-hidden whitespace-nowrap sticky top-0 z-[60] h-10 flex">
        <div className="flex animate-marquee items-center w-max">
          {/* Group 1 */}
          <div className="flex items-center gap-12 px-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em]">
                <span className="text-orange-400">Early Bird Offer</span>
                <span>•</span>
                <span>Get 40% OFF on all Pass Pro subscriptions</span>
                <span>•</span>
                <span className="text-blue-400">Register before 20 May</span>
                <span className="opacity-30">|</span>
              </div>
            ))}
          </div>
          {/* Group 2 (Identical for seamless loop) */}
          <div className="flex items-center gap-12 px-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em]">
                <span className="text-orange-400">Early Bird Offer</span>
                <span>•</span>
                <span>Get 40% OFF on all Pass Pro subscriptions</span>
                <span>•</span>
                <span className="text-blue-400">Register before 20 May</span>
                <span className="opacity-30">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={modal === 'login'} 
        onClose={() => setModal(null)} 
        onSwitch={() => setModal('register')}
        triggerRect={triggerRect}
      />
      <RegisterModal 
        isOpen={modal === 'register'} 
        onClose={() => setModal(null)} 
        onSwitch={() => setModal('login')}
        triggerRect={triggerRect}
      />

      {/* Top Bar - Brand & Login - Adjusted Top for Sticky Banner */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-10 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">ExamForge</span>
            </div>
            
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex relative w-96">
              <input 
                type="text" 
                placeholder="Search for Exams..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-2xl text-sm focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all outline-none font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => openModal('login', e)} 
              className="text-slate-600 hover:text-slate-900 font-bold text-sm px-4 py-2 transition-all active:scale-95"
            >
              Log in
            </button>
            <button 
              onClick={(e) => openModal('register', e)} 
              className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 py-2.5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Secondary Nav */}
      <div className="bg-white border-b border-slate-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 text-xs font-bold uppercase tracking-widest h-11 overflow-x-auto text-slate-400">
          <Link href="#" className="text-slate-900 hover:text-blue-600 whitespace-nowrap">Exams</Link>
          <Link href="#" className="hover:text-slate-900 whitespace-nowrap">Live Classes</Link>
          <Link href="#" className="hover:text-slate-900 whitespace-nowrap">FREE Test Series</Link>
          <Link href="#" className="hover:text-slate-900 whitespace-nowrap flex items-center gap-1.5">
            ExamForge Pass <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-md font-black">PRO</span>
          </Link>
          <Link href="#" className="hover:text-slate-900 whitespace-nowrap">Previous Papers</Link>
          <Link href="#" className="hover:text-slate-900 whitespace-nowrap">Rank Predictor</Link>
        </div>
      </div>

      <main className="pb-20">
        {/* Hero Section */}
        <section className="bg-white py-16 lg:py-24 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2.5 bg-white border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black mb-8 uppercase tracking-[0.15em] shadow-sm group cursor-default">
                <div className="relative flex items-center justify-center">
                  <Award className="w-4 h-4 text-blue-600 relative z-10 animate-[pulse_2s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 bg-blue-400 blur-md rounded-full opacity-20 animate-pulse" />
                </div>
                <span className="text-slate-900">India&apos;s #1 Exam Prep</span>
              </div>
              <h1 className="text-4xl lg:text-7xl font-black text-slate-900 leading-[1.05] mb-8 tracking-tighter">
                One Stop for <br />
                <span className="text-blue-600">Perfect Scores</span>
              </h1>
              <p className="text-xl text-slate-500 mb-10 max-w-lg font-medium leading-relaxed">
                Join 4.5Cr+ students preparing for Government Jobs, JEE, and NEET with India's most advanced learning platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={(e) => openModal('register', e)} 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-10 py-5 rounded-[24px] text-center shadow-2xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Start Now <ArrowRight className="w-6 h-6" />
                </button>
                <button className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-900 font-bold text-lg px-10 py-5 rounded-[24px] transition-all active:scale-95">
                  View Courses
                </button>
              </div>

              {/* Trust Stats */}
              <div className="flex items-center gap-10 py-8 border-t border-slate-100">
                <div>
                  <div className="text-3xl font-black text-slate-900">4.5Cr+</div>
                  <div className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Students</div>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div>
                  <div className="text-3xl font-black text-slate-900">80L+</div>
                  <div className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Attempts</div>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div>
                  <div className="text-3xl font-black text-slate-900">5L+</div>
                  <div className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Selections</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-blue-50/50 transform rotate-2 rounded-[48px]" />
              <div className="relative bg-white border border-slate-200 p-10 rounded-[48px] shadow-[0_48px_96px_-32px_rgba(0,0,0,0.12)]">
                <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight text-center">Select Your Exam</h3>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={(e) => openModal('login', e)} className="p-5 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group active:scale-95">
                     <div className="font-bold text-slate-800 group-hover:text-blue-600">SSC Exams</div>
                     <div className="text-xs text-slate-400 mt-1 font-medium tracking-tight">CGL, CHSL, MTS</div>
                   </button>
                   <button onClick={(e) => openModal('login', e)} className="p-5 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group active:scale-95">
                     <div className="font-bold text-slate-800 group-hover:text-blue-600">Banking</div>
                     <div className="text-xs text-slate-400 mt-1 font-medium tracking-tight">PO, Clerk, SO</div>
                   </button>
                   <button onClick={(e) => openModal('login', e)} className="p-5 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group active:scale-95">
                     <div className="font-bold text-slate-800 group-hover:text-blue-600">Teaching</div>
                     <div className="text-xs text-slate-400 mt-1 font-medium tracking-tight">CTET, TET, PRT</div>
                   </button>
                   <button onClick={(e) => openModal('login', e)} className="p-5 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group active:scale-95">
                     <div className="font-bold text-slate-800 group-hover:text-blue-600">Civil Services</div>
                     <div className="text-xs text-slate-400 mt-1 font-medium tracking-tight">UPSC, State PSC</div>
                   </button>
                </div>
                <button onClick={(e) => openModal('login', e)} className="w-full mt-8 bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                  Discover All Exams
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Exams Grid */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Popular Exams</h2>
              <p className="text-slate-500 font-medium">Updated to the latest 2026 patterns.</p>
            </div>
            <button onClick={(e) => openModal('login', e)} className="hidden sm:flex text-blue-600 font-bold items-center hover:underline">
              View All <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "SSC Exams", count: "120+", logo: "https://upload.wikimedia.org/wikipedia/en/d/d5/Staff_Selection_Commission.webp", color: "bg-slate-50 border-slate-100" },
              { title: "Banking & Insurance", count: "150+", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/IBPS_LOGO.png/330px-IBPS_LOGO.png", color: "bg-slate-50 border-slate-100" },
              { title: "Teaching Exams", count: "180+", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/95/CBSE_new_logo.svg/330px-CBSE_new_logo.svg.png", color: "bg-slate-50 border-slate-100" },
              { title: "JEE & Engineering", count: "40+", logo: "https://nta.ac.in/img/NTA_logo.png", color: "bg-slate-50 border-slate-100" },
              { title: "NEET & Medical", count: "25+", logo: "https://nta.ac.in/img/NTA_logo.png", color: "bg-slate-50 border-slate-100" },
              { title: "Civil Services", count: "60+", logo: "https://upload.wikimedia.org/wikipedia/en/b/bf/Union_public_service_commission.jpg", color: "bg-slate-50 border-slate-100" },
              { title: "State Govt. Exams", count: "400+", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/330px-Emblem_of_India.svg.png", color: "bg-slate-50 border-slate-100" },
              { title: "Defence Exams", count: "80+", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Indian_Armed_Forces_Tri_Service_Emblem.svg/330px-Indian_Armed_Forces_Tri_Service_Emblem.svg.png", color: "bg-slate-50 border-slate-100" },
            ].map((category, i) => (
              <button key={i} onClick={(e) => openModal('login', e)} className="group bg-white p-8 rounded-[32px] border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all flex flex-col items-center text-center w-full active:scale-95">
                <div className={`w-24 h-24 rounded-3xl border border-slate-50 flex items-center justify-center mb-6 ${category.color} group-hover:scale-110 transition-transform overflow-hidden p-4 bg-white`}>
                  <img src={category.logo} alt={category.title} className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
                </div>
                <h3 className="font-bold text-slate-800 text-xl mb-1.5">{category.title}</h3>
                <p className="text-sm text-slate-400 font-bold mb-6">{category.count} Exams</p>
                <div className="text-blue-600 text-sm font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Explore <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Pass / Subscription Bundle */}
        <section className="bg-slate-900 py-24 text-white mt-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-[120px] rounded-full -mr-1/4" />
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <div className="inline-block bg-white/10 backdrop-blur-md text-white border border-white/20 px-5 py-2 rounded-full font-black text-xs mb-8 uppercase tracking-widest">
                ExamForge Pass Pro
              </div>
              <h2 className="text-5xl font-black mb-8 leading-[1.1] tracking-tighter">
                Access <span className="text-blue-400">700+ Exam</span> Series <br /> with One Pass
              </h2>
              <p className="text-slate-400 text-xl mb-12 font-medium leading-relaxed">
                Unlimited Mock Tests, Previous Year Papers, and adaptive practice sets on India's most structured test platform.
              </p>
              
              <ul className="space-y-6 mb-12">
                {[
                  "75,000+ Mock Tests & Sectionals",
                  "17,000+ Previous Year Papers",
                  "Predictive All India Rank (AIR)",
                  "Deep Performance & Time Analysis"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-200 font-bold">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button onClick={(e) => openModal('login', e)} className="bg-white hover:bg-slate-100 text-slate-900 font-black text-xl px-12 py-5 rounded-[24px] shadow-2xl transition-all active:scale-95">
                Get Pass Pro @ ₹399
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
              <div className="relative bg-slate-800/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[48px] shadow-2xl">
                 <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
                   <div>
                     <div className="text-2xl font-black text-white">Yearly Pass Pro</div>
                     <div className="text-slate-400 text-sm font-bold mt-1">Valid for 365 Days</div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm text-slate-500 line-through font-bold">₹699</div>
                     <div className="text-4xl font-black text-blue-400 mt-1">₹399</div>
                   </div>
                 </div>
                 <div className="space-y-5">
                   <div className="bg-white/5 border border-white/5 p-5 rounded-3xl flex items-center gap-5">
                     <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                       <FileText className="w-7 h-7 text-blue-400" />
                     </div>
                     <div>
                       <div className="font-bold text-white text-lg">75,000+ Tests</div>
                       <div className="text-sm text-slate-500 font-medium">Latest 2026 pattern</div>
                     </div>
                   </div>
                   <div className="bg-white/5 border border-white/5 p-5 rounded-3xl flex items-center gap-5">
                     <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                       <PlayCircle className="w-7 h-7 text-purple-400" />
                     </div>
                     <div>
                       <div className="font-bold text-white text-lg">Video Solutions</div>
                       <div className="text-sm text-slate-500 font-medium">Expert walkthroughs</div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-20 tracking-tight">Why ExamForge?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center group">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mb-8 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Learn from Best</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Engaging and effective teaching methodologies from India's super teachers.</p>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[32px] flex items-center justify-center mb-8 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-500">
                <Trophy className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Score Analysis</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Know exactly where you lost marks and time with AI-driven reports.</p>
            </div>
            
            <div className="flex flex-col items-center group">
              <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-[32px] flex items-center justify-center mb-8 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                <Calculator className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Adaptive Prep</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Difficulty adjustments in real-time. Our AI pushes you harder for maximum growth.</p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 pt-24 pb-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">ExamForge</span>
              </div>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                India's premier destination for competitive exam preparation. Enabling millions of students to achieve their dreams.
              </p>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Exams</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-bold">
                <li><button onClick={(e) => openModal('login', e)} className="hover:text-blue-400 transition">SSC CGL</button></li>
                <li><button onClick={(e) => openModal('login', e)} className="hover:text-blue-400 transition">SBI PO</button></li>
                <li><button onClick={(e) => openModal('login', e)} className="hover:text-blue-400 transition">JEE Advanced</button></li>
                <li><button onClick={(e) => openModal('login', e)} className="hover:text-blue-400 transition">NEET UG</button></li>
                <li><button onClick={(e) => openModal('login', e)} className="hover:text-blue-400 transition">UPSC Civil</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Company</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-bold">
                <li><Link href="#" className="hover:text-blue-600 transition">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Support</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-bold">
                <li>support@examforge.com</li>
                <li>1800-123-4567</li>
                <li className="pt-4">
                  <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs transition active:scale-95">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-12 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} ExamForge EduTech. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <LandingPageContent />
    </Suspense>
  );
}
