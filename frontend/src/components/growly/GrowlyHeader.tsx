'use client';

import React from 'react';
import { Menu, Settings2, Target } from 'lucide-react';

interface GrowlyHeaderProps {
  userName: string;
  targetGoal: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export function GrowlyHeader({ userName, targetGoal, onMenuClick, onProfileClick }: GrowlyHeaderProps) {
  const initials = userName
    ? userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';

  return (
    <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#E6E9F0] bg-[#F8F9FC]/90 px-5 backdrop-blur-lg sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuClick} className="rounded-lg p-2 text-[#5E687D] hover:bg-white hover:text-[#18213A] md:hidden" aria-label="Open navigation"><Menu size={20} /></button>
        <div className="hidden h-6 w-px bg-[#DDE1EA] sm:block" />
        {targetGoal ? (
          <div className="hidden items-center gap-2 text-xs text-[#657085] sm:flex"><Target size={14} className="text-[#A66C14]" /><span className="font-medium">Target:</span><span className="max-w-[260px] truncate font-semibold text-[#25304A]">{targetGoal}</span></div>
        ) : (
          <button onClick={onProfileClick} className="hidden text-xs font-semibold text-[#3452A4] hover:text-[#1C2D63] sm:block">Set your target exam</button>
        )}
      </div>
      <button onClick={onProfileClick} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#AABBEA]">
        <span className="hidden text-right sm:block"><span className="block text-xs font-semibold leading-4 text-[#1A2337]">{userName || 'Student'}</span><span className="block text-[10px] text-[#778196]">Profile settings</span></span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C2D63] text-xs font-bold text-white shadow-[0_4px_10px_rgba(28,45,99,.18)]">{initials}</span>
        <Settings2 size={15} className="hidden text-[#778196] transition-colors group-hover:text-[#1C2D63] sm:block" />
      </button>
    </header>
  );
}
