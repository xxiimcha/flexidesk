import { Navigate, useLocation } from "react-router-dom";
import { getUserToken } from "../../../services/userAuth";

export default function RequireRole({ role, children }) {
  const token = getUserToken();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  // In a real app you'd decode the token or fetch the profile.
  // For the demo, infer role from the path prefix:
  const onOwnerRoute = (loc.pathname || "").startsWith("/owner");
  const expectedOwner = role === "owner";
  if (expectedOwner !== onOwnerRoute) return <Navigate to="/login" replace />;
  return children;
}
