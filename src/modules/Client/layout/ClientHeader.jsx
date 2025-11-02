// src/modules/User/components/ClientHeader.jsx
import { Link, NavLink, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { Briefcase, Home, Tent, ConciergeBell, Globe } from "lucide-react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import api from "@/services/api"; // axios instance with baseURL + JWT interceptor

const tabs = [
  { to: "/app", label: "Homes", icon: Home, end: true },
  { to: "/app/experiences", label: "Experiences", icon: Tent },
  { to: "/app/services", label: "Services", icon: ConciergeBell },
];

const DASHBOARD_PATH = "/owner/details";
const START_PATH = "/owner/start";

export default function ClientHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasListings, setHasListings] = useState(null); // null = unknown until checked
  const { pathname } = useLocation();

  // Show SearchBar ONLY on /app (allow trailing slash)
  const showSearch = useMemo(
    () => pathname === "/app" || pathname === "/app/",
    [pathname]
  );

  // Check if the signed-in user (via JWT) has at least one owner listing.
  // If the token is missing/invalid, this will 401 and we treat as "no listings".
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get("/owner/listings/mine", {
          params: { limit: 1 },
        });
        if (!alive) return;
        const hasAny = Array.isArray(data?.items) && data.items.length > 0;
        setHasListings(hasAny);
      } catch (e) {
        // Not logged in / not owner yet / any error → just show "Become a space owner"
        if (!alive) return;
        setHasListings(false);
        // Optional: console for debugging
        // console.warn("CTA listing check:", e?.response?.status, e?.message);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const cta = hasListings
    ? { to: DASHBOARD_PATH, label: "Go to my Host Dashboard" }
    : { to: START_PATH, label: "Become a space owner" };

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
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                  isActive ? "bg-ink text-white" : "text-ink/80 hover:bg-brand/10"
                }`
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

          {/* Dynamic CTA (desktop) */}
          <Link
            to={cta.to}
            className="hidden sm:inline-flex items-center rounded-full border border-charcoal/20 px-3 py-1.5 text-sm text-ink hover:bg-brand/10"
          >
            {cta.label}
          </Link>

          <UserMenu />

          {/* hamburger (mobile) */}
          <button
            className="md:hidden rounded p-2 hover:bg-brand/10"
            onClick={() => setMobileOpen((v) => !v)}
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

            {/* Dynamic CTA (mobile) */}
            <Link
              to={cta.to}
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-full border border-charcoal/20 px-3 py-1.5 text-sm text-ink hover:bg-brand/10"
            >
              {cta.label}
            </Link>
          </nav>
        </div>
      )}

      {/* pill search bar — only on /app */}
      {showSearch && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
