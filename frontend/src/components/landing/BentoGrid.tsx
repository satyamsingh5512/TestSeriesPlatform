'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: "Premium Bundles",
    desc: "Comprehensive test series for JEE Advanced, NEET, and Mains. Curated by top educators and mapped to the latest syllabus.",
    colSpan: "md:col-span-2",
  },
  {
    title: "Predictive AIR",
    desc: "AI-driven analytics that predict your All India Rank with 98% accuracy based on historical data.",
    colSpan: "md:col-span-1",
  },
  {
    title: "Adaptive Testing",
    desc: "Dynamic CAT engine that adjusts difficulty in real-time, pushing your limits exactly where needed.",
    colSpan: "md:col-span-1",
  },
  {
    title: "Detailed Analytics",
    desc: "Micro-level topic breakdown, time-spent analysis, and peer-to-peer benchmarking to guarantee improvement.",
    colSpan: "md:col-span-2",
  }
];

export const BentoGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/10 p-[1px]">
      {features.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`bg-[#0a0a0a] p-10 md:p-14 flex flex-col justify-between group relative overflow-hidden ${feature.colSpan}`}
        >
          {/* Hover effect gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="mb-12">
             <div className="w-8 h-8 border border-blue-500/30 rounded-full flex items-center justify-center mb-8">
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
             </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-medium tracking-tight text-white mb-4">
              {feature.title}
            </h3>
            <p className="text-neutral-400 font-light leading-relaxed max-w-md">
              {feature.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
