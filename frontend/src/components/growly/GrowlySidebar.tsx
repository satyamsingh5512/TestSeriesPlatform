'use client';
import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, BookOpen, Library, BarChart3, Users, Settings, X,
  GraduationCap, ClipboardList,
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface GrowlySidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: 'dashboard' },
  { icon: <ClipboardList size={18} />, label: 'Exams', href: 'exams' },
  { icon: <BookOpen size={18} />, label: 'Learning Paths', href: 'paths' },
  { icon: <Library size={18} />, label: 'Course Library', href: 'library' },
  { icon: <BarChart3 size={18} />, label: 'Analytics', href: 'analytics' },
  { icon: <Users size={18} />, label: 'Employees', href: 'employees' },
];

const bottomItems: NavItem[] = [
  { icon: <Settings size={18} />, label: 'Settings', href: 'settings' },
];

function NavItemRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${active
          ? 'bg-growly-blue-light text-growly-blue border-l-2 border-growly-blue pl-[10px]'
          : 'text-growly-muted hover:bg-gray-50 hover:text-growly-ink border-l-2 border-transparent'
        }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? 'text-growly-blue' : 'text-growly-muted group-hover:text-growly-ink'}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

export function GrowlySidebar({ activeNav, setActiveNav, mobileOpen, setMobileOpen }: GrowlySidebarProps) {
  const sidebar = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-[250px]">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-growly-blue flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-growly-blue tracking-tight">Growly</span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-growly-muted"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-growly-muted/60 px-3 mb-3">
          Main Menu
        </p>
        {navItems.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            active={activeNav === item.href}
            onClick={() => { setActiveNav(item.href); setMobileOpen(false); }}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 border-t border-gray-100 pt-4 space-y-1">
        {bottomItems.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            active={activeNav === item.href}
            onClick={() => { setActiveNav(item.href); setMobileOpen(false); }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] flex-shrink-0 fixed left-0 top-0 h-screen z-30">
        {sidebar}
      </aside>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full flex flex-col">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
