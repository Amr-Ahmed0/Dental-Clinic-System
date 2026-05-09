/**
 * Role-Based Access Control (RBAC) for Dental Clinic System
 *
 * ┌─────────────────────┬───────────────┬────────────┬───────────┐
 * │     Feature         │ Receptionist  │   Doctor   │  Patient  │
 * ├─────────────────────┼───────────────┼────────────┼───────────┤
 * │ Dashboard           │ Full stats    │ Own stats  │ Own stats │
 * │ Patients - View     │ All           │ Own only   │ Own only  │
 * │ Patients - Add/Edit │ ✅            │ ❌          │ ❌        │
 * │ Patients - Delete   │ ✅            │ ❌          │ ❌        │
 * │ Doctors  - View     │ All           │ All        │ Own only  │
 * │ Doctors  - Add/Edit │ ✅            │ ❌          │ ❌        │
 * │ Doctors  - Delete   │ ✅            │ ❌          │ ❌        │
 * │ Appointments - View │ All           │ Own only   │ Own only  │
 * │ Appointments - Add  │ ✅            │ ✅ (own)    │ ❌        │
 * │ Appointments - Edit │ ✅            │ ✅ (own)    │ ❌        │
 * │ Appointments - Del  │ ✅            │ ❌          │ ❌        │
 * │ Treatments - View   │ All           │ All        │ Own visits│
 * │ Treatments - CRUD   │ ✅            │ ❌          │ ❌        │
 * │ Visits    - View    │ All           │ Own only   │ Own only  │
 * │ Visits    - Add     │ ✅            │ ✅ (own)    │ ❌        │
 * │ Visits    - Delete  │ ✅            │ ❌          │ ❌        │
 * │ Payments  - View    │ All           │ ❌          │ Own only  │
 * │ Payments  - Add     │ ✅            │ ❌          │ ❌        │
 * │ Profile             │ Full          │ Full       │ Full      │
 * └─────────────────────┴───────────────┴────────────┴───────────┘
 */

import { Page } from './types';

export type Role = 'receptionist' | 'doctor' | 'patient';

export interface Permissions {
  // Which pages are visible in sidebar
  pages: Page[];

  // Per-entity permissions
  patients:     { view: boolean; viewAll: boolean; add: boolean; edit: boolean; delete: boolean };
  doctors:      { view: boolean; viewAll: boolean; add: boolean; edit: boolean; delete: boolean };
  appointments: { view: boolean; viewAll: boolean; add: boolean; edit: boolean; delete: boolean };
  treatments:   { view: boolean; viewAll: boolean; add: boolean; edit: boolean; delete: boolean };
  visits:       { view: boolean; viewAll: boolean; add: boolean; edit: boolean; delete: boolean };
  payments:     { view: boolean; viewAll: boolean; add: boolean };
  invoices:     { view: boolean; viewAll: boolean };

  // Dashboard
  dashboard: { viewAllStats: boolean; viewRevenue: boolean };
}

const receptionistPerms: Permissions = {
  pages: ['dashboard', 'patients', 'doctors', 'appointments', 'treatments', 'visits', 'payments', 'profile'],
  patients:     { view: true, viewAll: true, add: true, edit: true, delete: true },
  doctors:      { view: true, viewAll: true, add: true, edit: true, delete: true },
  appointments: { view: true, viewAll: true, add: true, edit: true, delete: true },
  treatments:   { view: true, viewAll: true, add: true, edit: true, delete: true },
  visits:       { view: true, viewAll: true, add: true, edit: true, delete: true },
  payments:     { view: true, viewAll: true, add: true },
  invoices:     { view: true, viewAll: true },
  dashboard:    { viewAllStats: true, viewRevenue: true },
};

const doctorPerms: Permissions = {
  pages: ['dashboard', 'patients', 'appointments', 'treatments', 'visits', 'profile'],
  patients:     { view: true, viewAll: false, add: false, edit: false, delete: false },
  doctors:      { view: true, viewAll: false, add: false, edit: false, delete: false },
  appointments: { view: true, viewAll: false, add: false, edit: true, delete: false },
  treatments:   { view: true, viewAll: true, add: false, edit: false, delete: false },
  visits:       { view: true, viewAll: false, add: true, edit: true, delete: false },
  payments:     { view: false, viewAll: false, add: false },
  invoices:     { view: false, viewAll: false },
  dashboard:    { viewAllStats: false, viewRevenue: false },
};

const patientPerms: Permissions = {
  pages: ['dashboard', 'appointments', 'visits', 'payments', 'profile'],
  patients:     { view: true, viewAll: false, add: false, edit: false, delete: false },
  doctors:      { view: true, viewAll: false, add: false, edit: false, delete: false },
  appointments: { view: true, viewAll: false, add: true, edit: false, delete: false },
  treatments:   { view: false, viewAll: false, add: false, edit: false, delete: false },
  visits:       { view: true, viewAll: false, add: false, edit: false, delete: false },
  payments:     { view: true, viewAll: false, add: true },
  invoices:     { view: true, viewAll: false },
  dashboard:    { viewAllStats: false, viewRevenue: false },
};

export function getPermissions(role: Role): Permissions {
  switch (role) {
    case 'receptionist': return receptionistPerms;
    case 'doctor':       return doctorPerms;
    case 'patient':      return patientPerms;
    default:             return patientPerms;
  }
}
