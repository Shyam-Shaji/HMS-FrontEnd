import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Role } from '@/types/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGate } from '@/components/auth/RoleGate';
import { PatientAppShell } from '@/components/layout/PatientAppShell';
import { StaffAppShell } from '@/components/layout/StaffAppShell';
import { ComingSoon } from '@/components/layout/ComingSoon';
import { AppLoadingScreen } from '@/components/layout/AppLoadingScreen';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const OtpPage = lazy(() => import('@/pages/auth/OtpPage').then((m) => ({ default: m.OtpPage })));
const RoleRedirectPage = lazy(() => import('@/pages/auth/RoleRedirectPage').then((m) => ({ default: m.RoleRedirectPage })));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PatientHomePage = lazy(() => import('@/pages/patient/PatientHomePage').then((m) => ({ default: m.PatientHomePage })));
const AppointmentsPage = lazy(() => import('@/pages/patient/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })));
const BookAppointmentPage = lazy(() => import('@/pages/patient/BookAppointmentPage').then((m) => ({ default: m.BookAppointmentPage })));
const AppointmentDetailPage = lazy(() => import('@/pages/patient/AppointmentDetailPage').then((m) => ({ default: m.AppointmentDetailPage })));
const RecordsPage = lazy(() => import('@/pages/patient/RecordsPage').then((m) => ({ default: m.RecordsPage })));
const RecordDetailPage = lazy(() => import('@/pages/patient/RecordDetailPage').then((m) => ({ default: m.RecordDetailPage })));
const PrescriptionsPage = lazy(() => import('@/pages/patient/PrescriptionsPage').then((m) => ({ default: m.PrescriptionsPage })));
const PrescriptionDetailPage = lazy(() => import('@/pages/patient/PrescriptionDetailPage').then((m) => ({ default: m.PrescriptionDetailPage })));
const LabReportsPage = lazy(() => import('@/pages/patient/LabReportsPage').then((m) => ({ default: m.LabReportsPage })));
const LabReportDetailPage = lazy(() => import('@/pages/patient/LabReportDetailPage').then((m) => ({ default: m.LabReportDetailPage })));
const BillingPage = lazy(() => import('@/pages/patient/BillingPage').then((m) => ({ default: m.BillingPage })));
const InvoiceDetailPage = lazy(() => import('@/pages/patient/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })));
const ReceptionDashboardPage = lazy(() => import('@/pages/reception/ReceptionDashboardPage').then((m) => ({ default: m.ReceptionDashboardPage })));
const ReceptionPatientsPage = lazy(() => import('@/pages/reception/ReceptionPatientsPage').then((m) => ({ default: m.ReceptionPatientsPage })));
const ReceptionPatientDetailPage = lazy(() => import('@/pages/reception/ReceptionPatientDetailPage').then((m) => ({ default: m.ReceptionPatientDetailPage })));
const ReceptionAppointmentsPage = lazy(() => import('@/pages/reception/ReceptionAppointmentsPage').then((m) => ({ default: m.ReceptionAppointmentsPage })));
const QueueBoardPage = lazy(() => import('@/pages/reception/QueueBoardPage').then((m) => ({ default: m.QueueBoardPage })));
const DoctorDashboardPage = lazy(() => import('@/pages/doctor/DoctorDashboardPage').then((m) => ({ default: m.DoctorDashboardPage })));
const DoctorQueuePage = lazy(() => import('@/pages/doctor/DoctorQueuePage').then((m) => ({ default: m.DoctorQueuePage })));
const DoctorSchedulePage = lazy(() => import('@/pages/doctor/DoctorSchedulePage').then((m) => ({ default: m.DoctorSchedulePage })));
const DoctorRoundsPage = lazy(() => import('@/pages/doctor/DoctorRoundsPage').then((m) => ({ default: m.DoctorRoundsPage })));
const RoundDetailPage = lazy(() => import('@/pages/doctor/RoundDetailPage').then((m) => ({ default: m.RoundDetailPage })));
const DoctorLabOrdersPage = lazy(() => import('@/pages/doctor/DoctorLabOrdersPage').then((m) => ({ default: m.DoctorLabOrdersPage })));
const ConsultationPage = lazy(() => import('@/pages/doctor/consultation/ConsultationPage').then((m) => ({ default: m.ConsultationPage })));
const NurseDashboardPage = lazy(() => import('@/pages/nurse/NurseDashboardPage').then((m) => ({ default: m.NurseDashboardPage })));
const WardBoardPage = lazy(() => import('@/pages/nurse/WardBoardPage').then((m) => ({ default: m.WardBoardPage })));
const NurseAdmissionsPage = lazy(() => import('@/pages/nurse/NurseAdmissionsPage').then((m) => ({ default: m.NurseAdmissionsPage })));
const NurseAdmissionDetailPage = lazy(() => import('@/pages/nurse/NurseAdmissionDetailPage').then((m) => ({ default: m.NurseAdmissionDetailPage })));
const MedicationsPage = lazy(() => import('@/pages/nurse/MedicationsPage').then((m) => ({ default: m.MedicationsPage })));
const TriagePage = lazy(() => import('@/pages/nurse/TriagePage').then((m) => ({ default: m.TriagePage })));
const PharmacyDashboardPage = lazy(() => import('@/pages/pharmacy/PharmacyDashboardPage').then((m) => ({ default: m.PharmacyDashboardPage })));
const DispenseQueuePage = lazy(() => import('@/pages/pharmacy/DispenseQueuePage').then((m) => ({ default: m.DispenseQueuePage })));
const InventoryPage = lazy(() => import('@/pages/pharmacy/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const PurchaseOrdersPage = lazy(() => import('@/pages/pharmacy/PurchaseOrdersPage').then((m) => ({ default: m.PurchaseOrdersPage })));
const LabDashboardPage = lazy(() => import('@/pages/lab/LabDashboardPage').then((m) => ({ default: m.LabDashboardPage })));
const LabQueuePage = lazy(() => import('@/pages/lab/LabQueuePage').then((m) => ({ default: m.LabQueuePage })));
const LabOrderWorkPage = lazy(() => import('@/pages/lab/LabOrderWorkPage').then((m) => ({ default: m.LabOrderWorkPage })));
const TestCataloguePage = lazy(() => import('@/pages/lab/TestCataloguePage').then((m) => ({ default: m.TestCataloguePage })));
const BillingDashboardPage = lazy(() => import('@/pages/staff/BillingDashboardPage').then((m) => ({ default: m.BillingDashboardPage })));
const AdminDashboardPage = lazy(() => import('@/pages/staff/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const SuperAdminDashboardPage = lazy(() => import('@/pages/super-admin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })));

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
    // Every page is its own chunk, loaded on first visit - a patient never
    // downloads the pharmacy screens, and vice versa.
    <Suspense fallback={<AppLoadingScreen />}>
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
            <Route path="/reception/patients" element={<ReceptionPatientsPage />} />
            <Route path="/reception/patients/:id" element={<ReceptionPatientDetailPage />} />
            <Route path="/reception/appointments" element={<ReceptionAppointmentsPage />} />
            <Route path="/reception/queue" element={<QueueBoardPage />} />
          </Route>
        </Route>

        {/* Doctor */}
        <Route element={<RoleGate allow={[Role.DOCTOR]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor/queue" element={<DoctorQueuePage />} />
            <Route path="/doctor/consultation/:appointmentId" element={<ConsultationPage />} />
            <Route path="/doctor/rounds" element={<DoctorRoundsPage />} />
            <Route path="/doctor/rounds/:id" element={<RoundDetailPage />} />
            <Route path="/doctor/lab-orders" element={<DoctorLabOrdersPage />} />
          </Route>
        </Route>

        {/* Nurse */}
        <Route element={<RoleGate allow={[Role.NURSE]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/nurse" element={<NurseDashboardPage />} />
            <Route path="/nurse/triage" element={<TriagePage />} />
            <Route path="/nurse/ward-board" element={<WardBoardPage />} />
            <Route path="/nurse/admissions" element={<NurseAdmissionsPage />} />
            <Route path="/nurse/admissions/:id" element={<NurseAdmissionDetailPage />} />
            <Route path="/nurse/medications" element={<MedicationsPage />} />
          </Route>
        </Route>

        {/* Pharmacist */}
        <Route element={<RoleGate allow={[Role.PHARMACIST]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/pharmacy" element={<PharmacyDashboardPage />} />
            <Route path="/pharmacy/queue" element={<DispenseQueuePage />} />
            <Route path="/pharmacy/inventory" element={<InventoryPage />} />
            <Route path="/pharmacy/purchase-orders" element={<PurchaseOrdersPage />} />
          </Route>
        </Route>

        {/* Lab technician */}
        <Route element={<RoleGate allow={[Role.LAB_TECHNICIAN]} />}>
          <Route element={<StaffAppShell />}>
            <Route path="/lab" element={<LabDashboardPage />} />
            <Route path="/lab/queue" element={<LabQueuePage />} />
            <Route path="/lab/queue/:id" element={<LabOrderWorkPage />} />
            <Route path="/lab/catalogue" element={<TestCataloguePage />} />
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
    </Suspense>
  );
}
