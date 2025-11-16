import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  FileText,
  Ban,
  Plus,
  Settings,
  CalendarCheck2,
  MessageSquare,
  CreditCard,
  Users,
  BarChart3, // 👈 NEW
} from "lucide-react";

function SectionLabel({ children }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-slate-500">
      {children}
    </div>
  );
}

function ManageItem({ icon: Icon, label, value, active, onClick }) {
  return (
    <Link
      to={`/owner?status=${value}`}
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        active ? "bg-ink text-white" : "text-ink hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function NavItem({ to, icon: Icon, label, end, badge, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm",
          isActive ? "bg-ink text-white" : "text-ink hover:bg-slate-50",
        ].join(" ")
      }
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {typeof badge === "number" && badge > 0 && (
        <span className="ml-2 inline-flex items-center rounded-full bg-ink/10 text-ink px-2 py-0.5 text-[11px]">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function OwnerSidebar({
  open,
  onClose,
  statusFilter,
  setStatusFilter,
  createTo = "/owner/start",
  bookingsBadge,
  inquiriesBadge,
  transactionsBadge,
  analyticsBadge,
  onNavigate,
}) {
  const location = useLocation();

  const handleNavigate = () => {
    onNavigate?.();
    onClose?.(); // close sidebar on mobile
  };

  // Only consider status highlighting when we are on the listings view
  const onListingsRoute =
    location.pathname === "/owner" ||
    location.pathname.startsWith("/owner/listings");

  const params = onListingsRoute
    ? new URLSearchParams(location.search)
    : null;

  const urlStatus = params?.get("status") || "all";
  const currentStatus = statusFilter || urlStatus;

  const handleStatusClick = (value) => {
    setStatusFilter?.(value); // sync with parent if provided
    handleNavigate();
  };

  return (
    <>
      {/* mobile backdrop */}
      <div
        className={[
          "fixed inset-0 z-20 bg-black/30 md:hidden",
          open ? "block" : "hidden",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 w-64 bg-white ring-1 ring-slate-200 transform transition md:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full md:-translate-x-0",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-200">
          <LayoutDashboard className="h-5 w-5 text-brand" />
          <div className="font-semibold">Host Dashboard</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Manage (filters) */}
          <SectionLabel>Manage</SectionLabel>
          <nav className="px-3 space-y-1">
            <ManageItem
              icon={LayoutDashboard}
              label="Overview"
              value="all"
              // Highlight only when we're on /owner or /owner/listings
              active={onListingsRoute && currentStatus === "all"}
              onClick={() => handleStatusClick("all")}
            />
            <ManageItem
              icon={CheckCircle2}
              label="Published"
              value="active"
              active={onListingsRoute && currentStatus === "active"}
              onClick={() => handleStatusClick("active")}
            />
            <ManageItem
              icon={Clock}
              label="Pending review"
              value="pending_review"
              active={onListingsRoute && currentStatus === "pending_review"}
              onClick={() => handleStatusClick("pending_review")}
            />
            <ManageItem
              icon={FileText}
              label="Drafts"
              value="draft"
              active={onListingsRoute && currentStatus === "draft"}
              onClick={() => handleStatusClick("draft")}
            />
            <ManageItem
              icon={Ban}
              label="Rejected"
              value="rejected"
              active={onListingsRoute && currentStatus === "rejected"}
              onClick={() => handleStatusClick("rejected")}
            />
          </nav>

          {/* Operations */}
          <SectionLabel>Operations</SectionLabel>
          <nav className="px-3 space-y-1">
            <NavItem
              to="/owner/bookings"
              icon={CalendarCheck2}
              label="Bookings"
              badge={bookingsBadge}
              onNavigate={handleNavigate}
            />
            <NavItem
              to="/owner/inquiries"
              icon={MessageSquare}
              label="Inquiries"
              badge={inquiriesBadge}
              onNavigate={handleNavigate}
            />
            <NavItem
              to="/owner/transactions"
              icon={CreditCard}
              label="Transactions"
              badge={transactionsBadge}
              onNavigate={handleNavigate}
            />
          </nav>

          {/* Insights / Financial Dashboard */}
          <SectionLabel>Insights</SectionLabel>
          <nav className="px-3 space-y-1">
            <NavItem
              to="/owner/analytics"
              icon={BarChart3}
              label="Financial dashboard"
              badge={analyticsBadge}
              onNavigate={handleNavigate}
            />
          </nav>

          {/* CTA */}
          <div className="px-3 pt-3">
            <Link
              to={createTo}
              onClick={handleNavigate}
              className="inline-flex w-full items-center gap-2 rounded-lg bg-brand text-ink px-3 py-2 text-sm font-semibold hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Create listing
            </Link>
          </div>
        </div>

        {/* Footer zone */}
        <div className="p-3 text-xs text-slate border-t border-slate-200">
          <div className="inline-flex items-center gap-2 rounded-md ring-1 ring-slate-200 px-2 py-1">
            <Settings className="h-3.5 w-3.5" /> Settings
          </div>
        </div>
      </aside>
    </>
  );
}
