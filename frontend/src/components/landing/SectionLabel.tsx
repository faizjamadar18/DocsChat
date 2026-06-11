export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium tracking-wide uppercase">
      {children}
    </div>
  );
}
