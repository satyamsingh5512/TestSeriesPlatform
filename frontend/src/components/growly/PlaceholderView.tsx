'use client';
import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description?: string;
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-growly-blue-light flex items-center justify-center mb-4">
        <Construction size={24} className="text-growly-blue" />
      </div>
      <h2 className="text-[18px] font-semibold text-growly-ink mb-2">{title}</h2>
      <p className="text-[14px] text-growly-muted max-w-sm">
        {description ?? 'This section is under active development. Check back soon.'}
      </p>
    </div>
  );
}
