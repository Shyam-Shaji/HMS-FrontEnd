import {Navigate, Outlet, useLocation} from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { AppLoadingScreen } from "../layout/AppLoadingScreen";

// Gate 1: must be authenticated at all. Role-specific gating is a
// separate component (RoleGate) so the two concerns - "logged in?" vs
// "allowed here?" - stay independently testable and composable.
export function ProtectedRoute(){
    const {user, isLoading}  = useAuth();
    const location = useLocation();

    if(isLoading) return <AppLoadingScreen/>

    if(!user){
        return <Navigate to='/login' state={{from:location}} replace/>;
    }

    return <Outlet/>
}