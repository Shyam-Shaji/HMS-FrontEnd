import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { HOME_PATH_BY_ROLE } from "@/config/nav-config";

// Lets the router send "/" to the right place without every link in the
// app needing to know the current user's role.
export function RoleRedirectPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_PATH_BY_ROLE[user.role]} replace />;
}
