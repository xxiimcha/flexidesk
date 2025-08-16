import { useState } from "react";
import { Briefcase } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-ink/90 text-white backdrop-blur border-b border-charcoal/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <Briefcase className="h-6 w-6 text-brand" />
          <span className="text-xl tracking-wide">FLEXIDESK</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#how" className="hover:text-brand">How it Works</a>
          <a href="#spaces" className="hover:text-brand">Spaces</a>
          <a href="#faq" className="hover:text-brand">FAQ</a>
          <a href="#get-started" className="inline-flex items-center rounded-full bg-brand px-4 py-2 font-medium text-ink hover:opacity-90">
            Get Started
          </a>
        </nav>
        <button className="md:hidden p-2 rounded hover:bg-charcoal/30" onClick={()=>setOpen(!open)} aria-label="Menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-charcoal/40 bg-ink text-white">
          <div className="px-4 py-3 flex flex-col gap-3 text-sm">
            <a href="#how" className="hover:text-brand">How it Works</a>
            <a href="#spaces" className="hover:text-brand">Spaces</a>
            <a href="#faq" className="hover:text-brand">FAQ</a>
            <a href="#get-started" className="rounded-md bg-brand px-3 py-2 text-ink text-center">Get Started</a>
          </div>
        </div>
      )}
    </header>
  );
}
