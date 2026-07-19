import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      className={cn("bg-slate-200/50 rounded-md", className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4 w-full",
            i === lines - 1 && "w-2/3" // Make the last line shorter
          )} 
        />
      ))}
    </div>
  );
};
