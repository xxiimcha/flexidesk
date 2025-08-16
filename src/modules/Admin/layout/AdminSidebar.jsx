// src/modules/Admin/layout/AdminSidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, CalendarDays, Wallet,
  ShieldCheck, BarChart3, Settings, Megaphone, Flag, ChevronDown
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },

  // User & Provider Management
  {
    label: "Users & Providers",
    icon: Users,
    children: [
      { to: "/admin/users", label: "Users" },
      { to: "/admin/users/verify", label: "Verify Identities" },
      { to: "/admin/users/fraud", label: "Prevent Fraud" },
      { to: "/admin/users/rbac", label: "Role-based Access" },
    ],
  },

  { to: "/admin/listings", label: "Listings", icon: Building2 },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet },

  // Dispute & Feedback Handling
  {
    label: "Disputes & Feedback",
    icon: Flag,
    children: [
      { to: "/admin/disputes", label: "User Disputes" },
      { to: "/admin/disputes/refunds", label: "Refund Issues" },
      { to: "/admin/disputes/policy-violations", label: "Policy Violations" },
    ],
  },

  // Monitoring & Reporting
  {
    label: "Monitoring & Reporting",
    icon: BarChart3,
    children: [
      { to: "/admin/reports/performance", label: "Workspace Performance" },
      { to: "/admin/reports/occupancy", label: "Occupancy" },
      { to: "/admin/reports/income", label: "Income" },
      { to: "/admin/reports/usage-trends", label: "Usage Trends" },
    ],
  },

  // Security & Compliance
  {
    label: "Security & Compliance",
    icon: ShieldCheck,
    children: [
      { to: "/admin/security/policies", label: "Encryption & Data Policies" },
      { to: "/admin/security/compliance", label: "Compliance Monitoring" },
    ],
  },

  // Platform Promotion
  {
    label: "Platform Promotion",
    icon: Megaphone,
    children: [{ to: "/admin/promotion/featured", label: "Featured Listings" }],
  },

  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  // Auto-open the group that contains the active route
  useEffect(() => {
    const next = {};
    NAV.forEach((item, idx) => {
      if (item.children?.some((c) => pathname.startsWith(c.to))) next[idx] = true;
    });
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  const toggle = (idx) => setOpenGroups((s) => ({ ...s, [idx]: !s[idx] }));

  return (
    <>
      {/* overlay for mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 lg:hidden transition ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed z-40 top-14 bottom-0 left-0 w-64 bg-white border-r border-charcoal/20 overflow-y-auto transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Sidebar"
      >
        <nav className="p-3">
          {NAV.map((item, idx) => {
            const Icon = item.icon;
            // Simple link
            if (!item.children) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm mb-1
                     ${isActive ? "bg-brand/20 text-ink font-medium" : "text-ink hover:bg-brand/10"}`
                  }
                  onClick={onClose}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            }

            // Group with children
            const expanded = !!openGroups[idx];
            return (
              <div key={item.label} className="mb-1">
                <button
                  onClick={() => toggle(idx)}
                  aria-expanded={expanded}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink hover:bg-brand/10"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="mt-1 pl-8">
                    {item.children.map((c) => (
                      <NavLink
                        key={c.to}
                        to={c.to}
                        className={({ isActive }) =>
                          `block rounded-md px-3 py-2 text-sm mb-1
                           ${isActive ? "bg-brand/20 text-ink font-medium" : "text-ink/90 hover:bg-brand/10"}`
                        }
                        onClick={onClose}
                      >
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
