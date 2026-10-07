import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/context/auth-context";

export function RoleGate({allow}: {allow: Role[]}){
    const {user} = useAuth();
    if(!user) return null; //ProtectedRoute, which always wraps this, already handles the redirect
    if(!allow.includes(user.role)) return <Navigate to="/403" replace />;
    return <Outlet/>
}