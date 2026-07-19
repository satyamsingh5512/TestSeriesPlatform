"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedLogo = ({ className = "h-6 w-6" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 font-mono font-bold text-[#111] tracking-tighter ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="text-[#111]"
      >
        <path
          d="M 20 20 L 80 20 L 80 80 L 20 80 Z"
          fill="currentColor"
        />
        <path
          d="M 40 40 L 60 40 L 60 60 L 40 60 Z"
          fill="#fff"
        />
      </svg>
      <span className="text-lg">
        Lumina<span className="text-gray-400">Edu</span>
      </span>
    </div>
  );
};
