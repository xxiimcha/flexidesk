// src/modules/Owner/components/OwnerHeader.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  RefreshCw,
  Plus,
  Bell,
  ChevronDown,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/services/userAuth";
import api from "@/services/api";

const MODE_KEY = "flexidesk_ui_mode";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OwnerHeader({
  query,
  onQueryChange,
  onRefresh,
  createTo = "/owner/start",
  onToggleNav,
  notificationsCount = 0,
  onNotificationsOpen,
  userName = "",
  avatarUrl = "",
  onSettings,
  onLogout,
  onSwitchClient,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifSummary, setNotifSummary] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);

  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      setNotifError(null);
      const res = await api.get("/owner/notifications/summary");
      setNotifSummary(res.data);
    } catch (e) {
      setNotifError("Unable to load notifications.");
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const initials =
    (userName || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "U";

  const doLogout = async () => {
    try {
      await logoutUser();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const switchToClient = () => {
    try {
      localStorage.setItem(MODE_KEY, "client");
    } catch {}
    navigate("/app");
  };

  const effectiveNotificationsCount =
    notifSummary && typeof notifSummary.totalUnread === "number"
      ? notifSummary.totalUnread
      : notificationsCount || 0;

  const bookingsUnread =
    notifSummary && notifSummary.bookings
      ? notifSummary.bookings.unreadCount || 0
      : 0;

  const inquiriesUnread =
    notifSummary && notifSummary.inquiries
      ? notifSummary.inquiries.unreadCount || 0
      : 0;

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
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search listings…"
            className="pl-9 pr-3 py-1.5 rounded-md ring-1 ring-slate-200 bg-white text-sm w-64"
          />
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
          onClick={onRefresh}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>

        <Link
          to={createTo}
          className="inline-flex items-center gap-2 rounded-md bg-brand text-ink px-3 py-1.5 text-sm font-semibold hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Create
        </Link>

        <button
          type="button"
          onClick={onSwitchClient ? onSwitchClient : switchToClient}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
          title="Switch to Client view"
        >
          Client view
        </button>

        <div className="mx-1 w-px h-6 bg-slate-200" />

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className="relative rounded p-2 hover:bg-slate-100"
            aria-label="Notifications"
            onClick={() => {
              const next = !notifOpen;
              setNotifOpen(next);
              if (next) {
                fetchNotifications();
                if (onNotificationsOpen) onNotificationsOpen();
              }
            }}
          >
            <Bell className="h-5 w-5" />
            {effectiveNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] grid place-items-center">
                {effectiveNotificationsCount > 99
                  ? "99+"
                  : effectiveNotificationsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-80 rounded-lg bg-white ring-1 ring-slate-200 shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 border-b text-sm font-medium">
                Notifications
              </div>
              <div className="max-h-80 overflow-y-auto text-sm text-slate">
                {notifLoading && (
                  <div className="p-3 text-sm text-slate-500">
                    Loading notifications…
                  </div>
                )}

                {notifError && !notifLoading && (
                  <div className="p-3 text-sm text-red-600">{notifError}</div>
                )}

                {!notifLoading &&
                  !notifError &&
                  effectiveNotificationsCount === 0 && (
                    <div className="p-4 text-sm text-slate">
                      You are all caught up.
                    </div>
                  )}

                {!notifLoading &&
                  !notifError &&
                  effectiveNotificationsCount > 0 && (
                    <div className="divide-y divide-slate-100">
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold uppercase text-slate-500">
                          Summary
                        </div>
                        <div className="mt-1 space-y-1">
                          {bookingsUnread > 0 && (
                            <div>
                              {bookingsUnread} booking
                              {bookingsUnread > 1 ? "s" : ""} needing review
                            </div>
                          )}
                          {inquiriesUnread > 0 && (
                            <div>
                              {inquiriesUnread} new message
                              {inquiriesUnread > 1 ? "s" : ""} from guests
                            </div>
                          )}
                        </div>
                      </div>

                      {notifSummary &&
                        notifSummary.bookings &&
                        notifSummary.bookings.latest &&
                        notifSummary.bookings.latest.length > 0 && (
                          <div className="px-3 py-2">
                            <div className="text-xs font-semibold uppercase text-slate-500">
                              Recent bookings
                            </div>
                            <ul className="mt-1 space-y-1">
                              {notifSummary.bookings.latest.map((b) => (
                                <li
                                  key={String(b.id)}
                                  className="flex flex-col rounded-md px-2 py-1 hover:bg-slate-50"
                                >
                                  <span className="font-medium">
                                    Booking {formatDate(b.startDate)}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    Status: {b.status}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {notifSummary &&
                        notifSummary.inquiries &&
                        notifSummary.inquiries.latest &&
                        notifSummary.inquiries.latest.length > 0 && (
                          <div className="px-3 py-2">
                            <div className="text-xs font-semibold uppercase text-slate-500">
                              Recent messages
                            </div>
                            <ul className="mt-1 space-y-1">
                              {notifSummary.inquiries.latest.map((i) => (
                                <li
                                  key={String(i.id)}
                                  className="flex flex-col rounded-md px-2 py-1 hover:bg-slate-50"
                                >
                                  <span className="font-medium">
                                    Inquiry {formatDate(i.meta?.startDate)}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    Last update:{" "}
                                    {formatDate(i.lastMessageAt)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                  if (onSettings) onSettings();
                }}
              >
                <SettingsIcon className="h-4 w-4" /> Settings
              </button>
              <button
                role="menuitem"
                className="w-full text-left text-sm px-3 py-2 hover:bg-rose-50 inline-flex items-center gap-2 text-rose-700"
                onClick={() => {
                  setMenuOpen(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    doLogout();
                  }
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
