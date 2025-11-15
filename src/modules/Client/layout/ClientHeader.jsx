// src/modules/User/components/ClientHeader.jsx
import { Link, NavLink, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { Briefcase, Home, Globe } from "lucide-react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import api from "@/services/api"; // axios instance with baseURL + JWT interceptor

// Only keep the main tab relevant to co-working space rentals
const tabs = [
  { to: "/app", label: "Workspaces", icon: Home, end: true },
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
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* top row */}
        <div className="h-16 flex items-center gap-3">
          {/* logo + brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10">
              <Briefcase className="h-5 w-5 text-brand" />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-ink text-lg leading-tight">
                FlexiDesk
              </span>
              <span className="hidden text-xs text-ink/60 sm:inline">
                Find your next workspace
              </span>
            </div>
          </Link>

          {/* center: tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-2 mx-auto">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all",
                    "border",
                    isActive
                      ? "bg-ink text-white border-ink shadow-sm"
                      : "border-transparent text-ink/80 hover:bg-brand/10 hover:border-brand/20",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* language pill */}
            <button className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-ink/80 hover:bg-brand/5">
              <Globe className="h-4 w-4" />
              <span>EN</span>
            </button>

            {/* Dynamic CTA (desktop) */}
            <Link
              to={cta.to}
              className="hidden sm:inline-flex items-center rounded-full bg-ink text-white px-3.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm hover:bg-ink/90"
            >
              {cta.label}
            </Link>

            {/* user menu (avatar etc.) */}
            <UserMenu />

            {/* hamburger (mobile) */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-full p-2 border border-charcoal/15 hover:bg-brand/10"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls="client-header-mobile-nav"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* mobile nav */}
        {mobileOpen && (
          <div
            id="client-header-mobile-nav"
            className="md:hidden border-t border-charcoal/10 pb-3"
          >
            <nav className="pt-2 flex flex-col gap-2">
              {tabs.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      "w-full rounded-xl px-3 py-2 text-sm font-medium",
                      "flex items-center justify-between",
                      isActive
                        ? "bg-ink text-white"
                        : "text-ink/80 hover:bg-brand/10",
                    ].join(" ")
                  }
                >
                  <span>{label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-white/80 md:text-ink/60">
                    Browse
                  </span>
                </NavLink>
              ))}

              {/* Dynamic CTA (mobile) */}
              <Link
                to={cta.to}
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-xl border border-charcoal/20 px-3 py-2 text-sm font-medium text-ink hover:bg-brand/10"
              >
                {cta.label}
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* pill search bar — only on /app */}
      {showSearch && (
        <div className="border-t border-charcoal/5 bg-white/90">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="rounded-2xl border border-charcoal/10 bg-white/95 shadow-sm px-3 py-2">
              <SearchBar />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
