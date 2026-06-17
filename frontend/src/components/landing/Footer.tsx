export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-sm font-semibold tracking-tight">DocsChat</span>
            <p className="text-xs text-white/40">&copy; 2026 DocsChat. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-xs text-white/50 hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="text-xs text-white/50 hover:text-white transition-colors">Pricing</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
