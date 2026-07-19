'use client';
import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface GrowlyHeaderProps {
  userName: string;
  onMenuClick: () => void;
}

export function GrowlyHeader({ userName, onMenuClick }: GrowlyHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HR';

  return (
    <header className="h-16 flex items-center justify-between px-6 md:px-8 bg-white border-b border-gray-100 sticky top-0 z-20">
      {/* Left: hamburger (mobile) + greeting */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-growly-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-growly-ink leading-tight">
            Welcome back, <span className="text-growly-blue">{userName || 'Team Lead'}</span>
          </h1>
          <p className="text-[12px] text-growly-muted">{today}</p>
        </div>
      </div>

      {/* Right: Search + Notification + Avatar */}
      <div className="flex items-center gap-3">
        {/* Search bar — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 w-56">
          <Search size={14} className="text-growly-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search courses, employees…"
            className="bg-transparent text-[13px] text-growly-ink placeholder:text-growly-muted/70 outline-none w-full"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors text-growly-muted hover:text-growly-ink">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-growly-blue border-2 border-white" />
        </button>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-growly-blue to-growly-steel flex items-center justify-center text-white text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity">
          {initials}
        </div>
      </div>
    </header>
  );
}
