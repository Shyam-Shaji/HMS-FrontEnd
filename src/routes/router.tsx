import { Routes, Route } from "react-router-dom";
import { Role } from "@/types/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGate } from "@/components/auth/RoleGate";
import { PatientAppShell } from "@/components/layout/PatientAppShell";
import { StaffAppShell } from "@/components/layout/StaffAppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

import { LoginPage } from "@/pages/auth/LoginPage";
import { OtpPage } from "@/pages/auth/OtpPage";
import { RoleRedirectPage } from "@/pages/auth/RoleRedirectPage";
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";

import { PatientHomePage } from "@/pages/patient/PatientHomePage";
import { AppointmentsPage } from "@/pages/patient/AppointmentsPage";
import { BookAppointmentPage } from "@/pages/patient/BookAppointmentPage";
import { AppointmentDetailPage } from "@/pages/patient/AppointmentDetailPage";
import { RecordsPage } from "@/pages/patient/RecordsPage";
import { RecordDetailPage } from "@/pages/patient/RecordDetailPage";
import { PrescriptionsPage } from "@/pages/patient/PrescriptionsPage";
import { PrescriptionDetailPage } from "@/pages/patient/PrescriptionDetailPage";
import { LabReportsPage } from "@/pages/patient/LabReportsPage";
import { LabReportDetailPage } from "@/pages/patient/LabReportDetailPage";
import { BillingPage } from "@/pages/patient/BillingPage";
import { InvoiceDetailPage } from "@/pages/patient/InvoiceDetailPage";
import { ReceptionDashboardPage } from "@/pages/staff/ReceptionDashboardPage";
import { DoctorDashboardPage } from "@/pages/staff/DoctorDashboardPage";
import { NurseDashboardPage } from "@/pages/staff/NurseDashboardPage";
import { PharmacyDashboardPage } from "@/pages/staff/PharmacyDashboardPage";
import { LabDashboardPage } from "@/pages/staff/LabDashboardPage";
import { BillingDashboardPage } from "@/pages/staff/BillingDashboardPage";
import { AdminDashboardPage } from "@/pages/staff/AdminDashboardPage";
import { SuperAdminDashboardPage } from "@/pages/super-admin/SuperAdminDashboardPage";

/**
 * One route tree, grouped by role. Every path here matches an entry in
 * config/nav-config.ts - the index route under each role renders that
 * role's real dashboard; every other nav item renders <ComingSoon />
 * until it's built out in a later pass. This keeps each role's full
 * navigation clickable and real from day one, same approach the backend
 * took (foundation first, modules filled in one at a time).
 *
 * Adding a new screen later is two edits: swap the matching ComingSoon
 * route below for the real page, and nothing else - the nav, the guard,
 * and the shell are already wired.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleRedirectPage />} />

        {/* Patient portal */}
        <Route element={<RoleGate allow={[Role.PATIENT]} />}>
          <Route element={<PatientAppShell />}>
            <Route path="/patient" element={<PatientHomePage />} />

            <Route path="/patient/appointments" element={<AppointmentsPage />} />
            <Route path="/patient/appointments/book" element={<BookAppointmentPage />} />
            <Route path="/patient/appointments/:id" element={<AppointmentDetailPage />} />

            <Route path="/patient/records" element={<RecordsPage />} />
            <Route path="/patient/records/:id" element={<RecordDetailPage />} />

            <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/patient/prescriptions/:id" element={<PrescriptionDetailPage />} />

            <Route path="/patient/lab-reports" element={<LabReportsPage />} />
            <Route path="/patient/lab-reports/:id" element={<LabReportDetailPage />} />

            <Route path="/patient/billing" element={<BillingPage />} />
            <Route path="/patient/billing/:id" element={<InvoiceDetailPage />} />
          </Route>
        </Route>

        {/* Reception */}
        <Route element={<RoleGate allow={[Role.RECEPTIONIST]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/reception" element={<ReceptionDashboardPage />} />
            <Route path="/reception/patients" element={<ComingSoon title="Patients" />} />
            <Route path="/reception/appointments" element={<ComingSoon title="Appointments" />} />
            <Route path="/reception/queue" element={<ComingSoon title="Queue board" />} />
          </Route>
        </Route>

        {/* Doctor */}
        <Route element={<RoleGate allow={[Role.DOCTOR]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/schedule" element={<ComingSoon title="My schedule" />} />
            <Route path="/doctor/queue" element={<ComingSoon title="Patient queue" />} />
            <Route path="/doctor/rounds" element={<ComingSoon title="Ward rounds" />} />
            <Route path="/doctor/lab-orders" element={<ComingSoon title="Lab orders" />} />
          </Route>
        </Route>

        {/* Nurse */}
        <Route element={<RoleGate allow={[Role.NURSE]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/nurse" element={<NurseDashboardPage />} />
            <Route path="/nurse/ward-board" element={<ComingSoon title="Ward board" />} />
            <Route path="/nurse/admissions" element={<ComingSoon title="Admissions" />} />
            <Route path="/nurse/medications" element={<ComingSoon title="Medication (MAR)" />} />
          </Route>
        </Route>

        {/* Pharmacist */}
        <Route element={<RoleGate allow={[Role.PHARMACIST]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/pharmacy" element={<PharmacyDashboardPage />} />
            <Route path="/pharmacy/queue" element={<ComingSoon title="Dispense queue" />} />
            <Route path="/pharmacy/inventory" element={<ComingSoon title="Inventory" />} />
            <Route path="/pharmacy/purchase-orders" element={<ComingSoon title="Purchase orders" />} />
          </Route>
        </Route>

        {/* Lab technician */}
        <Route element={<RoleGate allow={[Role.LAB_TECHNICIAN]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/lab" element={<LabDashboardPage />} />
            <Route path="/lab/queue" element={<ComingSoon title="Order queue" />} />
            <Route path="/lab/catalogue" element={<ComingSoon title="Test catalogue" />} />
          </Route>
        </Route>

        {/* Billing staff */}
        <Route element={<RoleGate allow={[Role.BILLING_STAFF]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/billing" element={<BillingDashboardPage />} />
            <Route path="/billing/invoices" element={<ComingSoon title="Invoices" />} />
            <Route path="/billing/payments" element={<ComingSoon title="Payments" />} />
          </Route>
        </Route>

        {/* Hospital admin */}
        <Route element={<RoleGate allow={[Role.HOSPITAL_ADMIN]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/staff" element={<ComingSoon title="Staff" />} />
            <Route path="/admin/wards" element={<ComingSoon title="Wards & beds" />} />
            <Route path="/admin/doctors" element={<ComingSoon title="Doctors" />} />
            <Route path="/admin/reports" element={<ComingSoon title="Reports" />} />
          </Route>
        </Route>

        {/* Super admin */}
        <Route element={<RoleGate allow={[Role.SUPER_ADMIN]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
            <Route path="/super-admin/hospitals" element={<ComingSoon title="Hospitals" />} />
            <Route path="/super-admin/users" element={<ComingSoon title="Platform users" />} />
            <Route path="/super-admin/health" element={<ComingSoon title="System health" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
