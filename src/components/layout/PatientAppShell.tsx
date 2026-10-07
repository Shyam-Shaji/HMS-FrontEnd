import { NavLink, Outlet } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getNavForRole } from "@/config/nav-config";
import { cn } from "@/lib/cn";
import { Button } from "../ui/button";

// The patient-facing shell: top nav, mobile-first, large tap targets,
// centered single-column content - built for clarity and reassurance
// rather than density, per the UI/UX spec. Bottom tab bar on small
// screens (thumb reach), top nav row on larger ones.
export function PatientAppShell() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const nav = getNavForRole(user.role);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              M
            </div>
            <span className="text-sm font-semibold tracking-tight">MediFlow</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => logout()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Top nav row on larger screens; hidden on mobile in favor of the bottom bar */}
        <nav className="mx-auto hidden max-w-2xl gap-1 overflow-x-auto px-4 pb-2 sm:flex">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length <= 2}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Bottom tab bar - mobile only */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-2xl">
          {nav.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length <= 2}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}