export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-[saas-fade-in-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      {children}
    </div>
  );
}
