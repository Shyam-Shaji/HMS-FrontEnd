import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getNavForRole } from '@/config/nav-config';
import { ROLE_LABELS } from '@/types/auth';
import { cn } from '@/lib/cn';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

function initials(label: string) {
  return label
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// The staff-facing shell: persistent left sidebar + topbar, built for
// fast, repeated, keyboard-and-mouse use at a desk - distinct on purpose
// from PatientAppShell's mobile-first top nav, per the UI/UX spec's
// "different roles need genuinely different UI modes" principle.
export function StaffAppShell() {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  if (!user) return null;

  const nav = getNavForRole(user.role);
  const roleLabel = ROLE_LABELS[user.role];

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          M
        </div>
        <span className="text-base font-semibold tracking-tight">MediFlow</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length <= 2}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">{sidebarContent}</aside>

      {/* Mobile sidebar (sheet-style overlay) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-lg">
            <div className="flex justify-end p-3">
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent" aria-label="Account menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(roleLabel)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block font-medium leading-tight">{roleLabel}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{roleLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}