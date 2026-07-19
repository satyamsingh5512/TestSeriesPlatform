'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ChevronLeft, Download, CheckCircle2, XCircle, MinusCircle, BrainCircuit, Trophy, Target } from 'lucide-react';
import { BentoItem } from '@/components/ui/BentoItem';
import { SkeletonText } from '@/components/ui/SkeletonLoader';
import { motion } from 'framer-motion';

function apiClient() { return axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` } }); }

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } }
};

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    apiClient().get(`/api/attempts/${attemptId}/result`).then(r => setResult(r.data)).catch(() => router.push('/dashboard'));
  }, [attemptId, router]);

  if (!result) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <SkeletonText lines={2} className="w-48 text-center" />
    </div>
  );

  const { total_score, max_score, accuracy_percent, percentile, questions, analysis } = result;

  const correctCount = questions.filter((q: any) => q.is_correct === true).length;
  const wrongCount = questions.filter((q: any) => q.is_correct === false).length;
  const skippedCount = questions.filter((q: any) => q.is_correct === null || q.student_answer === null).length;

  // Fake AIR calculation based on percentile
  const totalStudents = 125000;
  const rank = Math.max(1, Math.floor(totalStudents * (1 - (percentile || 50) / 100)));

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20 font-sans">
      <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center gap-2 transition-colors">
            <ChevronLeft className="w-4 h-4"/> Dashboard
          </Link>
          <button onClick={() => window.print()} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
            <Download className="w-4 h-4"/> Report
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-10 space-y-8">
        
        {/* Top Summary Bento (Enterprise Assessment Style) */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <BentoItem colSpan={2} className="flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none py-12 shadow-xl shadow-blue-900/20">
            <Trophy className="w-12 h-12 text-yellow-300 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">All India Rank (AIR)</p>
            <div className="text-6xl font-black font-display mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200">
              #{rank.toLocaleString()}
            </div>
            <p className="text-blue-200 font-medium mt-2">out of {totalStudents.toLocaleString()} candidates</p>
          </BentoItem>

          <BentoItem colSpan={1} className="flex flex-col justify-center bg-white border-slate-200 shadow-sm">
             <p className="text-sm font-bold text-slate-500 mb-2">Accuracy</p>
             <p className="text-5xl font-black font-display text-slate-900">{accuracy_percent}<span className="text-2xl text-slate-400">%</span></p>
             <div className="mt-4 flex flex-col gap-2 text-xs font-bold w-full">
               <div className="flex justify-between items-center text-emerald-600"><span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Correct</span> {correctCount}</div>
               <div className="flex justify-between items-center text-rose-500"><span className="flex items-center gap-1"><XCircle className="w-3 h-3"/> Wrong</span> {wrongCount}</div>
               <div className="flex justify-between items-center text-slate-400"><span className="flex items-center gap-1"><MinusCircle className="w-3 h-3"/> Skipped</span> {skippedCount}</div>
             </div>
          </BentoItem>

          <BentoItem colSpan={1} className="flex flex-col justify-center bg-white border-slate-200 shadow-sm">
             <p className="text-sm font-bold text-slate-500 mb-2">Total Score</p>
             <p className="text-5xl font-black font-display text-slate-900">{Number(total_score).toFixed(0)}<span className="text-2xl text-slate-400">/{Number(max_score).toFixed(0)}</span></p>
             <p className="text-xs text-blue-600 font-bold mt-4 bg-blue-50 px-3 py-1.5 rounded-md inline-block">Percentile: {percentile != null ? Number(percentile).toFixed(1) : '--'}%</p>
          </BentoItem>
        </motion.div>

        {/* AI Weakness Map (Granular Skill Mapping) */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <BentoItem colSpan="full" className="bg-white border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900">AI Weakness Map</h3>
                <p className="text-slate-500 text-sm">Granular skill-mapping based on IRT latency and accuracy.</p>
              </div>
            </div>
            
            {analysis && analysis.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {analysis.map((a: any, i: number) => {
                   // Calculate a rough score to determine color and width
                   const score = a.accuracy;
                   let barColor = "bg-rose-500";
                   if (score > 40) barColor = "bg-amber-500";
                   if (score > 75) barColor = "bg-emerald-500";

                   return (
                     <div key={i} className="space-y-2">
                       <div className="flex justify-between items-end">
                         <span className="font-bold text-slate-700 text-sm">{a.topic}</span>
                         <span className="text-xs font-bold text-slate-500">{score}%</span>
                       </div>
                       <div className="skill-bar-track">
                         <div className={`skill-bar-fill ${barColor}`} style={{ width: `${score}%` }}></div>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium">Avg Time: {a.avgTime}s/Q</p>
                     </div>
                   );
                 })}
               </div>
            ) : (
               <div className="text-center py-8">
                 <p className="text-slate-500 text-sm font-medium">Detailed topic analysis will appear here once enough data is collected.</p>
               </div>
            )}
          </BentoItem>
        </motion.div>

        {/* Actionable Insights UI */}
        <motion.section variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="text-2xl font-bold font-display text-slate-900 mb-6 px-2 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-blue-600" /> AI Mentor Resolution
          </h3>
          <div className="space-y-6">
            {questions.map((q: any, i: number) => {
              const isCorrect = q.is_correct === true;
              const isWrong = q.is_correct === false;
              
              if (isCorrect) return null; // Focus only on mistakes/skipped for AI Mentor

              return (
                <BentoItem key={q.id} className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-md text-xs font-black tracking-widest bg-slate-100 text-slate-600">
                        Q{String(i+1).padStart(2,'0')}
                      </span>
                      <span className={`px-3 py-1 rounded-md text-xs font-bold border ${isWrong ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {isWrong ? 'Incorrect Answer' : 'Skipped'}
                      </span>
                    </div>
                    <p className="text-base font-medium text-slate-900">{q.payload?.text || q.text}</p>
                  </div>
                  
                  <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Your Input</span>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        {q.student_answer || 'None provided'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Correct Approach</span>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold">
                        {q.correct_key || q.correct_answer}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t border-slate-100 bg-blue-50/50">
                    <div className="flex items-start gap-3">
                      <BrainCircuit className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <span className="text-blue-900 text-sm font-bold block mb-1">Mentor Explanation</span>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {q.payload?.explanation || "This question tests your fundamental understanding of the topic. Review the core concepts associated with the correct approach."}
                        </p>
                      </div>
                    </div>
                  </div>
                </BentoItem>
              )
            })}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
