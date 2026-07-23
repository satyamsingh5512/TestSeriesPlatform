'use client';

import React from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CircleUserRound,
  Compass,
  LogOut,
  Menu,
  Target,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type DashboardNav = 'command' | 'practice' | 'performance' | 'settings';

interface GrowlySidebarProps {
  activeNav: DashboardNav;
  setActiveNav: (nav: DashboardNav) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const primaryItems: Array<{ id: DashboardNav; label: string; caption: string; icon: React.ElementType }> = [
  { id: 'command', label: 'Command centre', caption: 'Your preparation', icon: Compass },
  { id: 'practice', label: 'Practice library', caption: 'Matched exams', icon: BookOpenCheck },
  { id: 'performance', label: 'Performance', caption: 'Attempt history', icon: BarChart3 },
];

function SidebarItem({ item, active, onClick }: { item: (typeof primaryItems)[number] | { id: DashboardNav; label: string; caption: string; icon: React.ElementType }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#9DB0E8]
        ${active ? 'bg-[#263B7A] text-white shadow-[0_7px_16px_rgba(16,31,80,.23)]' : 'text-[#B7C1D8] hover:bg-white/[0.07] hover:text-white'}`}
    >
      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${active ? 'bg-white/[0.13] text-[#F2C86E]' : 'bg-white/[0.06] text-[#AAB7D5] group-hover:text-[#E6BD65]'}`}><Icon size={16} strokeWidth={2} /></span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-4">{item.label}</span>
        <span className={`mt-0.5 block text-[10px] leading-3 ${active ? 'text-[#C9D4F0]' : 'text-[#8493B4]'}`}>{item.caption}</span>
      </span>
    </button>
  );
}

export function GrowlySidebar({ activeNav, setActiveNav, mobileOpen, setMobileOpen }: GrowlySidebarProps) {
  const router = useRouter();
  const choose = (view: DashboardNav) => {
    setActiveNav(view);
    setMobileOpen(false);
  };

  const sidebar = (
    <div className="glass-sidebar-dark flex h-full w-[272px] flex-col px-4 py-5 text-white">
      <div className="flex items-center justify-between px-2 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7B45B] text-[#17203B] shadow-[0_7px_18px_rgba(231,180,91,.2)]"><Target size={18} strokeWidth={2.5} /></span>
          <span>
            <span className="block font-display text-xl leading-5 tracking-[-0.04em] text-white">ExamForge</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-[#9CAAC9]">Preparation desk</span>
          </span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[#AAB7D5] hover:bg-white/[0.07] hover:text-white md:hidden" aria-label="Close navigation"><X size={18} /></button>
      </div>

      <div className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7889B1]">Workspace</div>
      <nav className="space-y-1.5">
        {primaryItems.map((item) => <SidebarItem key={item.id} item={item} active={activeNav === item.id} onClick={() => choose(item.id)} />)}
      </nav>

      <div className="my-6 border-t border-white/[0.08]" />
      <div className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7889B1]">Account</div>
      <SidebarItem item={{ id: 'settings', label: 'Profile', caption: 'Goals & study details', icon: CircleUserRound }} active={activeNav === 'settings'} onClick={() => choose('settings')} />

      <div className="mt-auto rounded-2xl border border-white/[0.11] bg-white/[0.055] p-3 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A4C4]">Preparation tip</p>
        <p className="mt-2 text-xs leading-5 text-[#C1CAE0]">Review each attempt before starting another one. Your analysis is the study plan.</p>
      </div>
      <button onClick={() => { localStorage.clear(); router.push('/'); }} className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#AAB7D5] transition-colors hover:bg-white/[0.07] hover:text-white"><LogOut size={15} /> Sign out</button>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] md:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button className="absolute inset-0 bg-[#091026]/60 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />
          <aside className="relative z-10 h-full shadow-2xl">{sidebar}</aside>
        </div>
      )}
    </>
  );
}
