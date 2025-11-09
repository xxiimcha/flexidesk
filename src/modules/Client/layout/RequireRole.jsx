// src/modules/Client/layout/RequireRole.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getUserToken, getCurrentUser } from "../../../services/userAuth";

export default function RequireRole({ role, children }) {
  const token = getUserToken();
  const loc = useLocation();
  const user = getCurrentUser?.(); // optional helper to read saved user

  if (!token) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }

  if (user && role && user.role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  const onOwnerRoute = (loc.pathname || "").startsWith("/owner");
  if (role === "owner" && !onOwnerRoute) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
