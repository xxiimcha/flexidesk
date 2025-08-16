// src/routes.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import AdminLogin from "./modules/Admin/Users/AdminLogin";
import AdminShell from "./modules/Admin/layout/AdminShell";
import RequireAdmin from "./modules/Admin/layout/RequireAdmin";
import AdminDashboard from "./modules/Admin/Dashboard/AdminDashboard";
import AdminStub from "./modules/Admin/layout/AdminStub";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminShell />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },

      // Users & Providers
      { path: "users", element: <AdminStub title="Users" /> },
      { path: "users/verify", element: <AdminStub title="Verify Identities" /> },
      { path: "users/fraud", element: <AdminStub title="Fraud Prevention" /> },
      { path: "users/rbac", element: <AdminStub title="Role-based Access Control (RBAC)" /> },

      // Core ops
      { path: "listings", element: <AdminStub title="Listings" /> },
      { path: "bookings", element: <AdminStub title="Bookings" /> },
      { path: "payouts", element: <AdminStub title="Payouts" /> },

      // Disputes & Feedback
      { path: "disputes", element: <AdminStub title="User Disputes" /> },
      { path: "disputes/refunds", element: <AdminStub title="Refund Issues" /> },
      { path: "disputes/policy-violations", element: <AdminStub title="Policy Violations" /> },

      // Monitoring & Reporting
      { path: "reports/performance", element: <AdminStub title="Workspace Performance" /> },
      { path: "reports/occupancy", element: <AdminStub title="Occupancy Analytics" /> },
      { path: "reports/income", element: <AdminStub title="Income Analytics" /> },
      { path: "reports/usage-trends", element: <AdminStub title="Usage Trends" /> },

      // Security & Compliance
      { path: "security/policies", element: <AdminStub title="Encryption & Data Access Policies" /> },
      { path: "security/compliance", element: <AdminStub title="Compliance Monitoring" /> },

      // Platform Promotion
      { path: "promotion/featured", element: <AdminStub title="Featured Listings (Promotion)" /> },

      // Settings
      { path: "settings", element: <AdminStub title="Settings" /> },
    ],
  },
]);

export default router;
