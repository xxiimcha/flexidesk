import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import App from "./App";

// Admin
import AdminLogin from "./modules/Admin/Users/AdminLogin";
import AdminShell from "./modules/Admin/layout/AdminShell";
import RequireAdmin from "./modules/Admin/layout/RequireAdmin";
import AdminDashboard from "./modules/Admin/Dashboard/AdminDashboard";
import AdminStub from "./modules/Admin/layout/AdminStub";
import UsersPage from "./modules/Admin/Users/UsersPage";
import AdminListingsPage from "./modules/Admin/Listings/ListingsPage";
import AdminBookingsPage from "./modules/Admin/Bookings/BookingsPage";

// Client
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
import ListingDetails from "./modules/Client/Listings/ListingDetails";

// Owner
import OwnerDashboard from "./modules/Owner/Dashboard/OwnerDashboard";
import Onboarding from "./modules/Owner/Onboarding/HostOnboarding";
import OwnerListingManage from "./modules/Owner/Listing/OwnerListingManage";

//Admin Modules
import AdminDisputesPage from "./modules/Admin/Disputes/DisputesPage";
import AdminRefundIssuesPage from "./modules/Admin/Disputes/RefundsPage";
import AdminPolicyViolationsPage from "./modules/Admin/Disputes/ViolationsPage";
import AdminChatCenter from "./modules/Admin/Chat/ChatCenter";
import AdminPaymentsPage from "./modules/Admin/Payments/PaymentsPage";
import AdminWorkspacePerformancePage from "./modules/Admin/Monitoring/WorkspacePerformancePage";
import AdminOccupancyReportPage from "./modules/Admin/Monitoring/OccupanyPage";
import AdminIncomeAnalyticsPage from "./modules/Admin/Monitoring/IncomeAnalytics";
import CheckoutStart from "./modules/Client/Checkout/CheckoutStart";
import CheckoutThankYou from "./modules/Client/Checkout/CheckoutThankYou";
import OwnerListingEdit from "./modules/Owner/Listing/OwnerListingEdit";
import ContactHostPage from "./modules/Client/Messages/ContactHostPage";

// Helper to preserve old deep links with real :id value
function RedirectSpaceToApp() {
  const { id } = useParams();
  return <Navigate to={`/app/spaces/${id}`} replace />;
}

const router = createBrowserRouter([
  { path: "/", element: <App /> },

  // Auth
  { path: "/login", element: <UserLogin /> },
  { path: "/register", element: <UserRegister /> },

  // Client area
  {
    path: "/app",
    element: (
    <RequireRole role={["client", "owner"]}>
        <ClientShell />
      </RequireRole>
    ),
    children: [
      { index: true, element: <UserDashboard /> },
      { path: "favorites", element: <ClientFavorites /> },
      { path: "bookings", element: <ClientBookings /> },
      { path: "payments", element: <ClientPayments /> },
      { path: "notifications", element: <ClientNotifications /> },
      { path: "messages", element: <ClientMessages /> },
      { path: "messages/new", element: <ContactHostPage /> },
      { path: "account", element: <ClientAccount /> },
      { path: "spaces/:id", element: <ListingDetails /> },
      { path: "checkout", element: <CheckoutStart /> },
      { path: "bookings/thank-you", element: <CheckoutThankYou /> },
      
    ],
  },

  // Old deep links → new location (with param preserved)
  { path: "/spaces/:id", element: <RedirectSpaceToApp /> },

  // Owner area
  { path: "/owner", element: <RequireRole role="owner"><OwnerDashboard /></RequireRole> },
  { path: "/owner/start", element: <Onboarding /> },
  { path: "/owner/details", element: <RequireRole role="owner"><OwnerDashboard /></RequireRole> },
  { path: "/owner/listings/:id", element: <RequireRole role="owner"><OwnerListingManage /></RequireRole> },
  { path: "/owner/listings/:id/edit", element: <RequireRole role="owner"><OwnerListingEdit /></RequireRole> },

  // Admin area
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

      { path: "users", element: <UsersPage /> },
      { path: "chat", element: <AdminChatCenter /> },
      { path: "listings", element: <AdminListingsPage /> },
      { path: "bookings", element: <AdminBookingsPage /> },
      { path: "disputes", element: <AdminDisputesPage /> },
      { path: "disputes/refunds", element: <AdminRefundIssuesPage /> },
      { path: "disputes/policy-violations", element: <AdminPolicyViolationsPage /> },
      { path: "payouts", element: <AdminPaymentsPage /> },
      { path: "reports/performance", element: <AdminWorkspacePerformancePage /> },
      { path: "reports/occupancy", element: <AdminOccupancyReportPage /> },
      { path: "reports/income", element: <AdminIncomeAnalyticsPage /> },

      // keep other stubs for now
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

  // Catch-all
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
