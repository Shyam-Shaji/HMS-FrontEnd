import { Link } from "react-router-dom";
import { CalendarPlus, FileText, Receipt, CalendarDays } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const quickActions = [
  { label: 'Book an appointment', to: '/patient/appointments', icon: CalendarPlus },
  { label: 'View health records', to: '/patient/records', icon: FileText },
  { label: 'Pay a bill', to: '/patient/billing', icon: Receipt },
];

// The patient's first screen - built around the product's core promise
// ("don't waste the patient's time"): the fastest path to booking is one
// tap away, and an empty appointments list reads as an invitation, not a
// dead end, per the UI/UX spec's content guidelines.
export function PatientHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's next for your care.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex flex-col items-start gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Upcoming appointments</h2>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
            <div>
              <p className="font-medium">No appointments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Book one to get started.</p>
            </div>
            <Link to="/patient/appointments" className="text-sm font-medium text-primary hover:underline">
              Book an appointment
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
