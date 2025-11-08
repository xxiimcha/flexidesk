import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard, CheckCircle2, Clock, FileText, Ban, Plus, Settings,
  CalendarCheck2, MessageSquare, CreditCard
} from "lucide-react";

function SectionLabel({ children }) {
  return <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-slate-500">{children}</div>;
}

function FilterButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        active ? "bg-ink text-white" : "text-ink hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
  onNavigate,
}) {
  return (
    <>
      {/* mobile backdrop */}
      <div
        className={["fixed inset-0 z-20 bg-black/30 md:hidden", open ? "block" : "hidden"].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 w-64 bg-white ring-1 ring-slate-200 transform transition md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:-translate-x-0",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-200">
          <LayoutDashboard className="h-5 w-5 text-brand" />
          <div className="font-semibold">Host Dashboard</div>
        </div>

        {/* Manage (filters) */}
        <SectionLabel>Manage</SectionLabel>
        <nav className="px-3 space-y-1">
          <FilterButton
            icon={LayoutDashboard}
            label="Overview"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter?.("all")}
          />
          <FilterButton
            icon={CheckCircle2}
            label="Published"
            active={statusFilter === "active"}
            onClick={() => setStatusFilter?.("active")}
          />
          <FilterButton
            icon={Clock}
            label="Pending review"
            active={statusFilter === "pending_review"}
            onClick={() => setStatusFilter?.("pending_review")}
          />
          <FilterButton
            icon={FileText}
            label="Drafts"
            active={statusFilter === "draft"}
            onClick={() => setStatusFilter?.("draft")}
          />
          <FilterButton
            icon={Ban}
            label="Rejected"
            active={statusFilter === "rejected"}
            onClick={() => setStatusFilter?.("rejected")}
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
            onNavigate={onNavigate}
          />
          <NavItem
            to="/owner/inquiries"
            icon={MessageSquare}
            label="Inquiries"
            badge={inquiriesBadge}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/owner/transactions"
            icon={CreditCard}
            label="Transactions"
            badge={transactionsBadge}
            onNavigate={onNavigate}
          />
        </nav>

        {/* CTA */}
        <div className="px-3 pt-3">
          <Link
            to={createTo}
            onClick={onNavigate}
            className="inline-flex w-full items-center gap-2 rounded-lg bg-brand text-ink px-3 py-2 text-sm font-semibold hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Create listing
          </Link>
        </div>

        {/* Footer zone */}
        <div className="mt-auto p-3 text-xs text-slate border-t border-slate-200">
          <div className="inline-flex items-center gap-2 rounded-md ring-1 ring-slate-200 px-2 py-1">
            <Settings className="h-3.5 w-3.5" /> Settings
          </div>
        </div>
      </aside>
    </>
  );
}
