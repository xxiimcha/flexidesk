// src/routes.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";

// Admin (unchanged)
import AdminLogin from "./modules/Admin/Users/AdminLogin";
import AdminShell from "./modules/Admin/layout/AdminShell";
import RequireAdmin from "./modules/Admin/layout/RequireAdmin";
import AdminDashboard from "./modules/Admin/Dashboard/AdminDashboard";
import AdminStub from "./modules/Admin/layout/AdminStub";

// 🔧 Client/Owner auth + pages (notice the extra /Client/)
import UserLogin from "./modules/Client/Users/UserLogin";
import UserRegister from "./modules/Client/Users/UserRegister";
import RequireRole from "./modules/Client/layout/RequireRole";

import ClientShell from "./modules/Client/layout/ClientShell";
import UserDashboard from "./modules/Client/Dashboard/UserDashboard";
import ClientFavorites from "./modules/Client/Favorites/ClientFavorites";
import ClientBookings from "./modules/Client/Bookings/ClientBookings";
import ClientPayments from "./modules/Client/Payments/ClientPayments";
import ClientNotifications from "./modules/Client/Notifications/ClientNotifications";
import ClientMessages from "./modules/Client/Messages/ClientMessages";
import ClientAccount from "./modules/Client/Account/ClientAccount";

// Owner (if you made it elsewhere, keep its path)
import OwnerDashboard from "./modules/Owner/Dashboard/OwnerDashboard";

const router = createBrowserRouter([
  { path: "/", element: <App /> },

  // unified login/register
  { path: "/login", element: <UserLogin /> },
  { path: "/register", element: <UserRegister /> },

  // client area (header-only)
  {
    path: "/app",
    element: <RequireRole role="client"><ClientShell /></RequireRole>,
    children: [
      { index: true, element: <UserDashboard /> },
      { path: "favorites", element: <ClientFavorites /> },
      { path: "bookings", element: <ClientBookings /> },
      { path: "payments", element: <ClientPayments /> },
      { path: "notifications", element: <ClientNotifications /> },
      { path: "messages", element: <ClientMessages /> },
      { path: "account", element: <ClientAccount /> },
    ],
  },

  // owner area
  { path: "/owner", element: <RequireRole role="owner"><OwnerDashboard /></RequireRole> },

  // admin area (unchanged)
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <RequireAdmin><AdminShell /></RequireAdmin>,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <AdminStub title="Users" /> },
      { path: "users/verify", element: <AdminStub title="Verify Identities" /> },
      { path: "users/fraud", element: <AdminStub title="Fraud Prevention" /> },
      { path: "users/rbac", element: <AdminStub title="Role-based Access Control (RBAC)" /> },
      { path: "listings", element: <AdminStub title="Listings" /> },
      { path: "bookings", element: <AdminStub title="Bookings" /> },
      { path: "payouts", element: <AdminStub title="Payouts" /> },
      { path: "disputes", element: <AdminStub title="User Disputes" /> },
      { path: "disputes/refunds", element: <AdminStub title="Refund Issues" /> },
      { path: "disputes/policy-violations", element: <AdminStub title="Policy Violations" /> },
      { path: "reports/performance", element: <AdminStub title="Workspace Performance" /> },
      { path: "reports/occupancy", element: <AdminStub title="Occupancy Analytics" /> },
      { path: "reports/income", element: <AdminStub title="Income Analytics" /> },
      { path: "reports/usage-trends", element: <AdminStub title="Usage Trends" /> },
      { path: "security/policies", element: <AdminStub title="Encryption & Data Access Policies" /> },
      { path: "security/compliance", element: <AdminStub title="Compliance Monitoring" /> },
      { path: "promotion/featured", element: <AdminStub title="Featured Listings (Promotion)" /> },
      { path: "settings", element: <AdminStub title="Settings" /> },
    ],
  },

  // optional catch-all to avoid blanks
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
