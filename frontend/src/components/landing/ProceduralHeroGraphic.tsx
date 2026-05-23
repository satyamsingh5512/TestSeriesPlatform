'use client';

import { motion } from 'framer-motion';

export const ProceduralHeroGraphic = () => {
  return (
    <div className="relative w-full aspect-square md:aspect-[4/3] max-w-2xl mx-auto overflow-hidden rounded-full mix-blend-screen opacity-90 blur-[1px]">
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-blue-900 via-indigo-800 to-emerald-300"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)'
        }}
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 z-10 opacity-50" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
      }} />

      {/* Orbiting element */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-300 rounded-full mix-blend-overlay blur-2xl"
        animate={{
          x: [0, 120, 0, -120, 0],
          y: [0, -60, 120, 60, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Secondary orbital */}
      <motion.div
        className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-purple-400 rounded-full mix-blend-overlay blur-3xl"
        animate={{
          x: [0, -80, 50, 80, 0],
          y: [0, 100, -50, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};
