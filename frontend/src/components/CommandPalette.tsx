'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-base/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
       <div className="panel w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
         <div className="flex items-center px-4 border-b border-themeBorder">
            <Search className="w-5 h-5 text-muted mr-3" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or type a command..." className="flex-1 bg-transparent border-none shadow-none text-highlight text-lg focus:ring-0 focus:shadow-none py-4" />
         </div>
         <div className="p-2 space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted px-2 py-1 tracking-widest">Quick Actions</div>
            <button onClick={() => { router.push('/dashboard'); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-hover text-primary text-sm transition-colors">Go to Dashboard</button>
            <button onClick={() => { router.push('/admin/exams'); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-hover text-primary text-sm transition-colors">Admin: Manage Exams</button>
            <button onClick={() => { const t = document.body.classList.contains('light-theme') ? 'dark' : 'light'; document.body.classList.toggle('light-theme'); localStorage.setItem('theme', t); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-hover text-primary text-sm transition-colors">Toggle Theme</button>
         </div>
       </div>
    </div>
  );
}
