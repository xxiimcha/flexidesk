import { Navigate, useLocation } from "react-router-dom";
import { getAdminToken } from "../../../services/adminAuth";

export default function RequireAdmin({ children }) {
  const token = getAdminToken();
  const loc = useLocation();
  if (!token) return <Navigate to="/admin/login" replace state={{ from: loc }} />;
  return children;
}
