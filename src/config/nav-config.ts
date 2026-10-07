import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  Pill,
  FlaskConical,
  Receipt,
  Building2,
  Stethoscope,
  ClipboardList,
  FileText,
  UserCog,
  ShieldCheck,
  Truck,
  Activity,
  CreditCard,
  Hospital,
} from 'lucide-react';
import { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// One source of truth for each role's navigation shell - matches the
// role-based information architecture from the product's page inventory.
// Every path here has a route registered in routes/router.tsx; most
// render a placeholder for now (built out module-by-module next).
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  [Role.PATIENT]: [
    { label: 'Home', path: '/patient', icon: LayoutDashboard },
    { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
    { label: 'Health records', path: '/patient/records', icon: FileText },
    { label: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
    { label: 'Lab reports', path: '/patient/lab-reports', icon: FlaskConical },
    { label: 'Billing', path: '/patient/billing', icon: Receipt },
  ],
  [Role.RECEPTIONIST]: [
    { label: 'Dashboard', path: '/reception', icon: LayoutDashboard },
    { label: 'Patients', path: '/reception/patients', icon: Users },
    { label: 'Appointments', path: '/reception/appointments', icon: CalendarDays },
    { label: 'Queue board', path: '/reception/queue', icon: Activity },
  ],
  [Role.DOCTOR]: [
    { label: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
    { label: 'My schedule', path: '/doctor/schedule', icon: CalendarDays },
    { label: 'Patient queue', path: '/doctor/queue', icon: Users },
    { label: 'Ward rounds', path: '/doctor/rounds', icon: BedDouble },
    { label: 'Lab orders', path: '/doctor/lab-orders', icon: FlaskConical },
  ],
  [Role.NURSE]: [
    { label: 'Dashboard', path: '/nurse', icon: LayoutDashboard },
    { label: 'Ward board', path: '/nurse/ward-board', icon: BedDouble },
    { label: 'Admissions', path: '/nurse/admissions', icon: ClipboardList },
    { label: 'Medication (MAR)', path: '/nurse/medications', icon: Pill },
  ],
  [Role.PHARMACIST]: [
    { label: 'Dashboard', path: '/pharmacy', icon: LayoutDashboard },
    { label: 'Dispense queue', path: '/pharmacy/queue', icon: ClipboardList },
    { label: 'Inventory', path: '/pharmacy/inventory', icon: Pill },
    { label: 'Purchase orders', path: '/pharmacy/purchase-orders', icon: Truck },
  ],
  [Role.LAB_TECHNICIAN]: [
    { label: 'Dashboard', path: '/lab', icon: LayoutDashboard },
    { label: 'Order queue', path: '/lab/queue', icon: ClipboardList },
    { label: 'Test catalogue', path: '/lab/catalogue', icon: FlaskConical },
  ],
  [Role.BILLING_STAFF]: [
    { label: 'Dashboard', path: '/billing', icon: LayoutDashboard },
    { label: 'Invoices', path: '/billing/invoices', icon: Receipt },
    { label: 'Payments', path: '/billing/payments', icon: CreditCard },
  ],
  [Role.HOSPITAL_ADMIN]: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Staff', path: '/admin/staff', icon: UserCog },
    { label: 'Wards & beds', path: '/admin/wards', icon: BedDouble },
    { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
    { label: 'Reports', path: '/admin/reports', icon: Activity },
  ],
  [Role.SUPER_ADMIN]: [
    { label: 'Dashboard', path: '/super-admin', icon: LayoutDashboard },
    { label: 'Hospitals', path: '/super-admin/hospitals', icon: Hospital },
    { label: 'Platform users', path: '/super-admin/users', icon: ShieldCheck },
    { label: 'System health', path: '/super-admin/health', icon: Building2 },
  ],
};

export function getNavForRole(role: Role): NavItem[] {
  return NAV_BY_ROLE[role] ?? [];
}

// Where each role lands immediately after login.
export const HOME_PATH_BY_ROLE: Record<Role, string> = {
  [Role.PATIENT]: '/patient',
  [Role.RECEPTIONIST]: '/reception',
  [Role.DOCTOR]: '/doctor',
  [Role.NURSE]: '/nurse',
  [Role.PHARMACIST]: '/pharmacy',
  [Role.LAB_TECHNICIAN]: '/lab',
  [Role.BILLING_STAFF]: '/billing',
  [Role.HOSPITAL_ADMIN]: '/admin',
  [Role.SUPER_ADMIN]: '/super-admin',
};