// src/modules/Admin/components/RequireAdmin.jsx
import { Navigate } from "react-router-dom";
import useAdminSession from "../modules/Admin/state/useAdminSession";

export default function RequireAdmin({ children }) {
  const { loading, isAdmin } = useAdminSession();
  if (loading) return null; // or a spinner
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
