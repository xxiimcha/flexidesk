import { Menu, Bell, LogOut, Search, Briefcase } from "lucide-react";
import { logoutAdmin } from "../../../services/adminAuth";
import { useNavigate } from "react-router-dom";

export default function AdminHeader({ onToggleSidebar }) {
  const nav = useNavigate();
  const doLogout = () => {
    logoutAdmin();
    nav("/admin/login", { replace: true });
  };

  return (
    <header
      className="
        fixed top-0 inset-x-0 z-50
        h-14 flex items-center justify-between
        px-4 border-b border-charcoal/20 bg-white
      "
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-brand/10"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-ink" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-brand" />
          <span className="font-semibold text-ink">FlexiDesk Admin</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 max-w-md flex-1 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate" />
          <input
            className="w-full rounded-md border border-charcoal/20 bg-white pl-9 pr-3 py-2 text-sm"
            placeholder="Search bookings, users, payouts…"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-1.5 rounded hover:bg-brand/10"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-ink" />
        </button>
        <button
          onClick={doLogout}
          className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </header>
  );
}
