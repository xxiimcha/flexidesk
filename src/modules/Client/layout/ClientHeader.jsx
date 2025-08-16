import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import {
  Briefcase, Home, Tent, ConciergeBell, Globe, LogOut,
} from "lucide-react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import { logoutUser } from "../../../services/userAuth";

const tabs = [
  { to: "/app", label: "Homes", icon: Home, end: true },
  { to: "/app/experiences", label: "Experiences", icon: Tent },
  { to: "/app/services", label: "Services", icon: ConciergeBell },
];

export default function ClientHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-charcoal/15">
      {/* top row */}
      <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Briefcase className="h-6 w-6 text-brand" />
          <span className="font-semibold text-ink text-lg">FlexiDesk</span>
        </Link>

        {/* center: tabs (desktop) */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm
                 ${isActive ? "bg-ink text-white" : "text-ink/80 hover:bg-brand/10"}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-ink/80 hover:bg-brand/10">
            <Globe className="h-4 w-4" /> EN
          </button>

          <UserMenu />

          <button
            onClick={() => { logoutUser(); window.location.assign("/login"); }}
            className="hidden lg:inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>

          {/* hamburger (mobile) */}
          <button
            className="md:hidden rounded p-2 hover:bg-brand/10"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* mobile tabs */}
      {mobileOpen && (
        <div className="md:hidden border-t border-charcoal/15">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap gap-2">
            {tabs.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm ${
                    isActive ? "bg-ink text-white" : "text-ink/80 hover:bg-brand/10"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { logoutUser(); window.location.assign("/login"); }}
              className="ml-auto rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-ink"
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* pill search bar */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <SearchBar />
      </div>
    </header>
  );
}
