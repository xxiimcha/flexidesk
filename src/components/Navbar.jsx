import { useState } from "react";

const LOGO = "/images/logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-ink/60 backdrop-blur-xl border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex items-center justify-between">

        {/* Brand */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <img
            src={LOGO}
            alt="FlexiDesk"
            className="h-7 w-auto object-contain"
          />
          <span className="text-sm font-semibold tracking-wide text-white hidden sm:block">
            FlexiDesk
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#how" className="text-slate-200 hover:text-white transition">
            How it Works
          </a>
          <a href="#spaces" className="text-slate-200 hover:text-white transition">
            Spaces
          </a>
          <a href="#faq" className="text-slate-200 hover:text-white transition">
            FAQ
          </a>

          {/* Emphasized Login Button (Brand Yellow) */}
          <a
            href="/login"
            className="px-4 py-1.5 rounded-full bg-brand text-ink font-semibold text-sm shadow-sm hover:opacity-90 transition"
          >
            Log in
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-ink/90 text-white">
          <div className="px-6 py-4 flex flex-col gap-4 text-sm">
            <a href="#how" className="hover:text-brand">How it Works</a>
            <a href="#spaces" className="hover:text-brand">Spaces</a>
            <a href="#faq" className="hover:text-brand">FAQ</a>

            {/* Mobile Login Button (Brand Yellow) */}
            <a
              href="/login"
              className="px-4 py-2 rounded-full bg-brand text-ink font-semibold text-center shadow-sm hover:opacity-90 transition"
            >
              Log in
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
