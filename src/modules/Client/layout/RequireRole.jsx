// src/modules/Client/layout/RequireRole.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getUserToken, getCurrentUser } from "../../../services/userAuth";

export default function RequireRole({ role, children }) {
  const token = getUserToken();
  const loc = useLocation();
  const user = getCurrentUser?.(); 

  if (!token) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  const allowedRoles = role
    ? (Array.isArray(role) ? role : [role]).map(r => String(r).toLowerCase())
    : [];

  const userRole = String(user?.role || "").toLowerCase();

  if (allowedRoles.length && userRole) {
    const ok = allowedRoles.includes(userRole);
    if (!ok) {
      if (userRole === "owner") {
        return <Navigate to="/owner" replace />;
      }
      if (userRole === "admin") {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // ✅ Token present & role allowed
  return children;
}
