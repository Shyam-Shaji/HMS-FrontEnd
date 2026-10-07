import { StaffDashboardPage } from "./StaffDashboardPage";

export function ReceptionDashboardPage() {
  return (
    <StaffDashboardPage
      title="Reception"
      subtitle="Today's check-ins and appointments at a glance."
      stats={[
        { label: "Today's appointments", hint: 'Booked for today' },
        { label: 'Checked in', hint: 'Currently waiting' },
        { label: 'Walk-ins today', hint: 'Not pre-booked' },
      ]}
    />
  );
}
