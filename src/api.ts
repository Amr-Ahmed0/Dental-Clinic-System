/**
 * API Service Layer
 * Connects the React frontend to the Express + SQL Server backend.
 *
 * Base URL: http://localhost:5001/api
 *
 * SQL Server (via mssql driver) returns PascalCase column names.
 * These mappers normalise both PascalCase and camelCase responses
 * into the frontend types so the rest of the app is backend-agnostic.
 */

import { Patient, Doctor, Appointment, Treatment, Visit, Invoice, Payment, User } from './types';

// ─── Configuration ──────────────────────────────────────────────────────────────
const API_BASE = '/api';
// ─── Low-level helpers ──────────────────────────────────────────────────────────

/** Return the first defined, non-null value among the given keys. */
function pick<T = any>(obj: any, ...keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

/** Normalise a date (ISO datetime or date string) to YYYY-MM-DD. */
function fmtDate(v: any): string {
  if (!v) return '';
  const s = String(v);
  if (s.includes('T')) return s.split('T')[0];
  return s.length > 10 ? s.slice(0, 10) : s;
}

/** Core fetch wrapper with error handling. */
async function request<T = any>(endpoint: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...opts,
  });

  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try {
      const body = await res.json();
      msg = body.message || body.error || body.msg || msg;
    } catch { /* ignore parse errors */ }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

/** Unwrap common backend response shapes into a plain array. */
function unwrap(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.recordset && Array.isArray(data.recordset)) return data.recordset;
  if (data?.recordsets?.[0]) return data.recordsets[0];
  // Some endpoints return a single object — wrap it
  if (data && typeof data === 'object' && !Array.isArray(data)) return [data];
  return [];
}

// ─── Response → Frontend mappers ────────────────────────────────────────────────

function mapPatient(r: any): Patient {
  return {
    id:             pick<number>(r, 'PatientID', 'patientId', 'patient_id', 'id') ?? 0,
    firstName:      pick<string>(r, 'FirstName', 'firstName', 'first_name') ?? '',
    lastName:       pick<string>(r, 'LastName', 'lastName', 'last_name') ?? '',
    gender:         pick<string>(r, 'Gender', 'gender') ?? '',
    dob:            fmtDate(pick(r, 'DateOfBirth', 'dateOfBirth', 'dob', 'DOB', 'date_of_birth', 'BirthDate')),
    phone:          pick<string>(r, 'Phone', 'phone', 'PhoneNumber', 'phoneNumber') ?? '',
    email:          pick<string>(r, 'Email', 'email') ?? '',
    address:        pick<string>(r, 'Address', 'address') ?? '',
    medicalHistory: pick<string>(r, 'MedicalHistory', 'medicalHistory', 'medical_history') ?? '',
    assignedDoctor: pick<string>(r, 'DoctorName', 'doctorName', 'AssignedDoctor', 'assignedDoctor', 'doctor_name')
                    ?? (pick(r, 'DoctorID', 'doctorId') ? `Doctor #${pick(r, 'DoctorID', 'doctorId')}` : ''),
  };
}

function mapDoctor(r: any): Doctor {
  return {
    id:           pick<number>(r, 'DoctorID', 'doctorId', 'doctor_id', 'id') ?? 0,
    name:         pick<string>(r, 'Name', 'name', 'DoctorName', 'doctorName') ?? '',
    specialty:    pick<string>(r, 'Specialty', 'specialty', 'Specialization', 'specialization') ?? '',
    phone:        pick<string>(r, 'Phone', 'phone', 'PhoneNumber') ?? '',
    email:        pick<string>(r, 'Email', 'email') ?? '',
    workingHours: pick<string>(r, 'WorkingHours', 'workingHours', 'working_hours', 'Schedule', 'schedule') ?? '',
  };
}

function mapAppointment(r: any): Appointment {
  return {
    id:          pick<number>(r, 'AppointmentID', 'appointmentId', 'appointment_id', 'id') ?? 0,
    patientId:   pick<number>(r, 'PatientID', 'patientId', 'patient_id') ?? 0,
    patientName: pick<string>(r, 'PatientName', 'patientName', 'patient_name') ?? '',
    doctorId:    pick<number>(r, 'DoctorID', 'doctorId', 'doctor_id') ?? 0,
    doctorName:  pick<string>(r, 'DoctorName', 'doctorName', 'doctor_name') ?? '',
    date:        fmtDate(pick(r, 'AppointmentDate', 'appointmentDate', 'Date', 'date', 'appointment_date')),
    time:        pick<string>(r, 'AppointmentTime', 'appointmentTime', 'Time', 'time', 'appointment_time') ?? '',
    status:      pick<string>(r, 'Status', 'status') as Appointment['status'] ?? 'Scheduled',
    reason:      pick<string>(r, 'Reason', 'reason', 'Notes', 'notes') ?? '',
  };
}

function mapTreatment(r: any): Treatment {
  return {
    id:          pick<number>(r, 'TreatmentID', 'treatmentId', 'treatment_id', 'id') ?? 0,
    name:        pick<string>(r, 'Name', 'name', 'TreatmentName', 'treatmentName') ?? '',
    description: pick<string>(r, 'Description', 'description') ?? '',
    cost:        pick<number>(r, 'Cost', 'cost', 'Price', 'price') ?? 0,
    duration:    pick<string>(r, 'Duration', 'duration') ?? '',
    category:    pick<string>(r, 'Category', 'category') ?? '',
  };
}

function mapVisit(r: any): Visit {
  // treatmentIds may come embedded or we fill them later
  let tIds: number[] = [];
  if (r.treatmentIds) tIds = r.treatmentIds;
  else if (r.TreatmentIDs) tIds = r.TreatmentIDs;
  else if (r.treatments && Array.isArray(r.treatments)) {
    tIds = r.treatments.map((t: any) => pick<number>(t, 'TreatmentID', 'treatmentId', 'id') ?? 0);
  }

  return {
    id:          pick<number>(r, 'VisitID', 'visitId', 'visit_id', 'id') ?? 0,
    patientId:   pick<number>(r, 'PatientID', 'patientId', 'patient_id') ?? 0,
    patientName: pick<string>(r, 'PatientName', 'patientName', 'patient_name') ?? '',
    doctorId:    pick<number>(r, 'DoctorID', 'doctorId', 'doctor_id') ?? 0,
    doctorName:  pick<string>(r, 'DoctorName', 'doctorName', 'doctor_name') ?? '',
    date:        fmtDate(pick(r, 'VisitDate', 'visitDate', 'Date', 'date', 'visit_date')),
    diagnosis:   pick<string>(r, 'Diagnosis', 'diagnosis') ?? '',
    notes:       pick<string>(r, 'Notes', 'notes') ?? '',
    treatmentIds: tIds,
    status:      pick<string>(r, 'Status', 'status') as Visit['status'] ?? 'In Progress',
  };
}

function mapInvoice(r: any): Invoice {
  return {
    id:          pick<number>(r, 'InvoiceID', 'invoiceId', 'invoice_id', 'id') ?? 0,
    patientId:   pick<number>(r, 'PatientID', 'patientId', 'patient_id') ?? 0,
    patientName: pick<string>(r, 'PatientName', 'patientName', 'patient_name') ?? '',
    total:       pick<number>(r, 'TotalAmount', 'totalAmount', 'Total', 'total', 'total_amount') ?? 0,
    discount:    pick<number>(r, 'Discount', 'discount') ?? 0,
    final:       pick<number>(r, 'FinalAmount', 'finalAmount', 'Final', 'final', 'final_amount', 'NetAmount') ?? 0,
    status:      pick<string>(r, 'Status', 'status') as Invoice['status'] ?? 'Unpaid',
    createdAt:   fmtDate(pick(r, 'CreatedAt', 'createdAt', 'created_at', 'InvoiceDate', 'invoiceDate')),
  };
}

function mapPayment(r: any): Payment {
  return {
    id:          pick<number>(r, 'PaymentID', 'paymentId', 'payment_id', 'id') ?? 0,
    invoiceId:   pick<number>(r, 'InvoiceID', 'invoiceId', 'invoice_id') ?? 0,
    patientName: pick<string>(r, 'PatientName', 'patientName', 'patient_name') ?? '',
    amount:      pick<number>(r, 'Amount', 'amount', 'PaymentAmount') ?? 0,
    method:      pick<string>(r, 'PaymentMethod', 'paymentMethod', 'Method', 'method', 'payment_method') ?? '',
    date:        fmtDate(pick(r, 'PaymentDate', 'paymentDate', 'Date', 'date', 'payment_date')),
    notes:       pick<string>(r, 'Notes', 'notes') ?? '',
  };
}

function mapUser(r: any): User {
  return {
    id:        String(pick(r, 'UserID', 'userId', 'user_id', 'id') ?? ''),
    name:      pick<string>(r, 'Name', 'name', 'FullName', 'fullName') ?? '',
    email:     pick<string>(r, 'Email', 'email') ?? '',
    role:      (pick<string>(r, 'Role', 'role') ?? 'patient') as User['role'],
    phone:     pick<string>(r, 'Phone', 'phone', 'PhoneNumber') ?? '',
    password:  '',                                       // never store plaintext on client
    createdAt: fmtDate(pick(r, 'CreatedAt', 'createdAt', 'created_at')),
  };
}

// ─── Health check ───────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    await request('/health');
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<User> {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Backend may return the user directly or nested in data.user / data.data
  const raw = data?.user || data?.data || data;
  return mapUser(raw);
}

export async function apiRegister(body: {
  name: string; email: string; password: string; role: string; phone: string;
}): Promise<User> {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const raw = data?.user || data?.data || data;
  return mapUser(raw);
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  totalVisits: number;
  totalInvoices: number;
  totalTreatments: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const r = await request<any>('/dashboard/stats');
  return {
    totalPatients:     pick<number>(r, 'totalPatients', 'TotalPatients', 'patients') ?? 0,
    totalDoctors:      pick<number>(r, 'totalDoctors', 'TotalDoctors', 'doctors') ?? 0,
    totalAppointments: pick<number>(r, 'totalAppointments', 'TotalAppointments', 'appointments') ?? 0,
    totalRevenue:      pick<number>(r, 'totalRevenue', 'TotalRevenue', 'revenue') ?? 0,
    totalVisits:       pick<number>(r, 'totalVisits', 'TotalVisits', 'visits') ?? 0,
    totalInvoices:     pick<number>(r, 'totalInvoices', 'TotalInvoices', 'invoices') ?? 0,
    totalTreatments:   pick<number>(r, 'totalTreatments', 'TotalTreatments', 'treatments') ?? 0,
  };
}

export async function fetchTodayAppointments(): Promise<Appointment[]> {
  const data = await request('/dashboard/today-appointments');
  return unwrap(data).map(mapAppointment);
}

// ─── Patients ───────────────────────────────────────────────────────────────────

export async function fetchPatients(): Promise<Patient[]> {
  const data = await request('/patients');
  return unwrap(data).map(mapPatient);
}

export async function createPatient(p: Omit<Patient, 'id'>): Promise<Patient> {
  const data = await request('/patients', {
    method: 'POST',
    body: JSON.stringify({
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      dateOfBirth: p.dob || null,
      phone: p.phone,
      email: p.email,
      address: p.address,
      medicalHistory: p.medicalHistory,
      doctorId: null,  // resolved below if needed
    }),
  });
  return mapPatient(data?.data || data);
}

export async function updatePatientApi(id: number, p: Partial<Patient>): Promise<void> {
  await request(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      dateOfBirth: p.dob || null,
      phone: p.phone,
      email: p.email,
      address: p.address,
      medicalHistory: p.medicalHistory,
    }),
  });
}

export async function deletePatientApi(id: number): Promise<void> {
  await request(`/patients/${id}`, { method: 'DELETE' });
}

// ─── Doctors ────────────────────────────────────────────────────────────────────

export async function fetchDoctors(): Promise<Doctor[]> {
  const data = await request('/doctors');
  return unwrap(data).map(mapDoctor);
}

export async function createDoctor(d: Omit<Doctor, 'id'>): Promise<Doctor> {
  const data = await request('/doctors', {
    method: 'POST',
    body: JSON.stringify({
      name: d.name,
      specialty: d.specialty,
      phone: d.phone,
      email: d.email,
      workingHours: d.workingHours,
    }),
  });
  return mapDoctor(data?.data || data);
}

export async function updateDoctorApi(id: number, d: Partial<Doctor>): Promise<void> {
  await request(`/doctors/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: d.name,
      specialty: d.specialty,
      phone: d.phone,
      email: d.email,
      workingHours: d.workingHours,
    }),
  });
}

export async function deleteDoctorApi(id: number): Promise<void> {
  await request(`/doctors/${id}`, { method: 'DELETE' });
}

// ─── Appointments ───────────────────────────────────────────────────────────────

export async function fetchAppointments(): Promise<Appointment[]> {
  // Use the "with-names" endpoint so we get patient & doctor names joined
  try {
    const data = await request('/dashboard/appointments-with-names');
    return unwrap(data).map(mapAppointment);
  } catch {
    // Fallback to plain appointments
    const data = await request('/appointments');
    return unwrap(data).map(mapAppointment);
  }
}

export async function createAppointment(a: {
  patientId: number; doctorId: number; date: string; time: string; status: string; reason: string;
}): Promise<Appointment> {
  const data = await request('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      patientId: a.patientId,
      doctorId: a.doctorId,
      appointmentDate: a.date,
      appointmentTime: a.time,
      status: a.status,
      reason: a.reason,
    }),
  });
  return mapAppointment(data?.data || data);
}

export async function updateAppointmentApi(id: number, fields: Record<string, any>): Promise<void> {
  await request(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export async function deleteAppointmentApi(id: number): Promise<void> {
  await request(`/appointments/${id}`, { method: 'DELETE' });
}

// ─── Treatments ─────────────────────────────────────────────────────────────────

export async function fetchTreatments(): Promise<Treatment[]> {
  const data = await request('/treatments');
  return unwrap(data).map(mapTreatment);
}

export async function createTreatmentApi(t: Omit<Treatment, 'id'>): Promise<Treatment> {
  const data = await request('/treatments', {
    method: 'POST',
    body: JSON.stringify({
      name: t.name,
      description: t.description,
      cost: t.cost,
      duration: t.duration,
      category: t.category,
    }),
  });
  return mapTreatment(data?.data || data);
}

export async function updateTreatmentApi(id: number, t: Partial<Treatment>): Promise<void> {
  await request(`/treatments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: t.name,
      description: t.description,
      cost: t.cost,
      duration: t.duration,
      category: t.category,
    }),
  });
}

export async function deleteTreatmentApi(id: number): Promise<void> {
  await request(`/treatments/${id}`, { method: 'DELETE' });
}

// ─── Visits ─────────────────────────────────────────────────────────────────────

export async function fetchVisits(): Promise<Visit[]> {
  const data = await request('/visits');
  const visits = unwrap(data).map(mapVisit);

  // Try to load treatments for each visit
  await Promise.allSettled(
    visits.map(async (v) => {
      try {
        const tData = await request(`/visits/${v.id}/treatments`);
        const tList = unwrap(tData);
        v.treatmentIds = tList.map((t: any) => pick<number>(t, 'TreatmentID', 'treatmentId', 'id') ?? 0);
      } catch {
        // endpoint may not exist or visit has no treatments — fine
      }
    }),
  );

  return visits;
}

export async function createVisitApi(v: {
  patientId: number; doctorId: number; date: string;
  diagnosis: string; notes: string; status: string; treatmentIds: number[];
}): Promise<Visit> {
  const data = await request('/visits', {
    method: 'POST',
    body: JSON.stringify({
      patientId: v.patientId,
      doctorId: v.doctorId,
      visitDate: v.date,
      diagnosis: v.diagnosis,
      notes: v.notes,
      status: v.status,
    }),
  });

  const created = mapVisit(data?.data || data);

  // Link treatments to the visit
  for (const tid of v.treatmentIds) {
    try {
      await request(`/visits/${created.id}/treatments`, {
        method: 'POST',
        body: JSON.stringify({ treatmentId: tid }),
      });
    } catch { /* ok */ }
  }
  created.treatmentIds = v.treatmentIds;

  return created;
}

export async function deleteVisitApi(id: number): Promise<void> {
  await request(`/visits/${id}`, { method: 'DELETE' });
}

// ─── Invoices ───────────────────────────────────────────────────────────────────

export async function fetchInvoices(): Promise<Invoice[]> {
  const data = await request('/invoices');
  return unwrap(data).map(mapInvoice);
}

export async function updateInvoiceApi(id: number, fields: Record<string, any>): Promise<void> {
  await request(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

// ─── Payments ───────────────────────────────────────────────────────────────────

export async function fetchPayments(): Promise<Payment[]> {
  const data = await request('/payments');
  return unwrap(data).map(mapPayment);
}

export async function createPaymentApi(p: {
  invoiceId: number; amount: number; method: string; date: string; notes: string;
}): Promise<Payment> {
  const data = await request('/payments', {
    method: 'POST',
    body: JSON.stringify({
      invoiceId: p.invoiceId,
      amount: p.amount,
      paymentMethod: p.method,
      paymentDate: p.date,
      notes: p.notes,
    }),
  });
  return mapPayment(data?.data || data);
}

// ─── Name resolution helper (used by App to fill missing names) ─────────────

export function resolveNames(
  appointments: Appointment[],
  patients: Patient[],
  doctors: Doctor[],
): Appointment[] {
  return appointments.map((a) => ({
    ...a,
    patientName:
      a.patientName ||
      (() => {
        const p = patients.find((x) => x.id === a.patientId);
        return p ? `${p.firstName} ${p.lastName}` : `Patient #${a.patientId}`;
      })(),
    doctorName:
      a.doctorName ||
      doctors.find((x) => x.id === a.doctorId)?.name ||
      `Doctor #${a.doctorId}`,
  }));
}
