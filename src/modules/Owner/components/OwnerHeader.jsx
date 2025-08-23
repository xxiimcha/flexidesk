import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu, Search, RefreshCw, Plus,
  Bell, ChevronDown, Settings as SettingsIcon, LogOut
} from "lucide-react";

export default function OwnerHeader({
  query,
  onQueryChange,
  onRefresh,
  createTo = "/owner/start",
  onToggleNav,

  // NEW props
  notificationsCount = 0,
  onNotificationsOpen,            // optional: () => void (e.g., navigate to /owner/inbox)
  userName = "",
  avatarUrl = "",
  onSettings,                      // optional: () => void
  onLogout,                        // optional: () => void
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // close popovers on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  const initials = (userName || "").trim().split(/\s+/).slice(0,2).map(s => s[0]).join("").toUpperCase() || "U";

  return (
    <header className="h-14 sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200 px-4 flex items-center gap-2">
      <button
        className="md:hidden rounded p-2 hover:bg-slate-100"
        onClick={onToggleNav}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="font-semibold">Overview</div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search listings…"
            className="pl-9 pr-3 py-1.5 rounded-md ring-1 ring-slate-200 bg-white text-sm w-64"
          />
        </div>

        {/* Refresh */}
        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
          onClick={onRefresh}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>

        {/* Create */}
        <Link
          to={createTo}
          className="inline-flex items-center gap-2 rounded-md bg-brand text-ink px-3 py-1.5 text-sm font-semibold hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Create
        </Link>

        {/* Divider */}
        <div className="mx-1 w-px h-6 bg-slate-200" />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className="relative rounded p-2 hover:bg-slate-100"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((v) => !v);
              if (onNotificationsOpen && !notifOpen) onNotificationsOpen();
            }}
          >
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] grid place-items-center">
                {notificationsCount > 99 ? "99+" : notificationsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-72 rounded-lg bg-white ring-1 ring-slate-200 shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 border-b text-sm font-medium">Notifications</div>
              <div className="max-h-72 overflow-y-auto">
                {notificationsCount === 0 ? (
                  <div className="p-4 text-sm text-slate">You’re all caught up. 🎉</div>
                ) : (
                  <div className="p-3 text-sm text-slate">
                    You have {notificationsCount} new notification{notificationsCount > 1 ? "s" : ""}.
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <Link
                  to="/owner/inbox"
                  className="block text-center text-sm rounded-md border px-3 py-1.5 hover:bg-slate-50"
                  onClick={() => setNotifOpen(false)}
                >
                  Open inbox
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || "Profile"}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <span className="h-7 w-7 rounded-full bg-slate-200 text-ink text-xs grid place-items-center font-medium ring-1 ring-slate-200">
                {initials}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-slate" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 rounded-lg bg-white ring-1 ring-slate-200 shadow-lg overflow-hidden"
            >
              <button
                role="menuitem"
                className="w-full text-left text-sm px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  onSettings ? onSettings() : null;
                }}
              >
                <SettingsIcon className="h-4 w-4" /> Settings
              </button>
              <button
                role="menuitem"
                className="w-full text-left text-sm px-3 py-2 hover:bg-rose-50 inline-flex items-center gap-2 text-rose-700"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout ? onLogout() : null;
                }}
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
