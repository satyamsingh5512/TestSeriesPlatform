'use client';
import React, { Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings2, Users, BookOpen, LayoutDashboard, LogOut, Sun, Zap } from 'lucide-react';
import { useTenant } from '@/components/TenantProvider';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant } = useTenant();

  const brandName = tenant?.name || "AdminForge";
  const brandLogo = tenant?.logo_url || null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[var(--border)] bg-[var(--bg-base)]/50 backdrop-blur-xl p-6 flex flex-col gap-8 sticky top-0 md:h-screen z-20">
        <div className="flex items-center gap-3 text-[var(--text-highlight)] px-2">
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-crisp">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-bold font-display text-xl tracking-tight text-highlight">{brandName} Admin</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-4 mb-3">Core Controls</p>
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={pathname === '/admin'} href="/admin" />
          <NavItem icon={<Users />} label="User Management" active={pathname.startsWith('/admin/users')} href="/admin/users" />
          <NavItem icon={<BookOpen />} label="Exam Control" active={pathname.startsWith('/admin/exams')} href="/admin/exams" />
          <NavItem icon={<Settings2 />} label="Tenant Features" active={pathname.startsWith('/admin/features')} href="/admin/features" />
        </nav>

        <div className="pt-6 border-t border-[var(--border)] space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { document.body.classList.toggle('light-theme'); localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark'); }} className="flex-1 btn h-9 bg-[var(--bg-panel)] border-[var(--border)] hover:bg-[var(--bg-panel-hover)] flex justify-center text-[var(--text-muted)]">
              <Sun className="w-4 h-4"/>
            </button>
            <button onClick={() => { localStorage.clear(); router.push('/'); }} className="flex-1 btn h-9 bg-[var(--bg-panel)] border-[var(--border)] hover:bg-[var(--bg-panel-hover)] flex justify-center text-[var(--text-muted)] hover:text-error transition-colors">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, href }: { icon: any, label: string, active: boolean, href: string }) {
  const content = (
    <>
      <div className={`${active ? 'opacity-100' : 'opacity-70'}`}>
        {React.cloneElement(icon, { size: 18, strokeWidth: active ? 2.5 : 2 })}
      </div>
      <span>{label}</span>
    </>
  );
  
  const className = `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${active ? 'bg-[var(--text-highlight)] text-[var(--bg-base)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-panel-hover)] hover:text-[var(--text-highlight)]'}`;

  return (
    <a href={href} className={className}>
      {content}
    </a>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center animate-pulse"><Zap className="w-8 h-8 text-accent"/></div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
