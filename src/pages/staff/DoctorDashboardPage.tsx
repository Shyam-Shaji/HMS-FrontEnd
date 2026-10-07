import { StaffDashboardPage } from "./StaffDashboardPage";

export function DoctorDashboardPage() {
  return (
    <StaffDashboardPage
      title="Dashboard"
      subtitle="Your schedule and patient queue for today."
      stats={[
        { label: 'Patients waiting', hint: 'In your queue now' },
        { label: "Today's appointments", hint: 'Total scheduled' },
        { label: 'Pending lab results', hint: 'Ordered by you' },
      ]}
    />
  );
}
