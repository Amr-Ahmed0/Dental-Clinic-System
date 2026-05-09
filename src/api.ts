/**
 * API Service Layer — Dual-Mode Architecture
 *
 * 1. LIVE MODE  → Calls Express backend on localhost:5001 → SQL Server
 * 2. DEMO MODE  → Falls back to in-memory seed data when backend is unreachable
 *
 * The app auto-detects which mode to use at startup.
 */

import { Patient, Doctor, Appointment, Treatment, Visit, Invoice, Payment, User } from './types';

// ─── Configuration ──────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5001/api';

// ─── Mode state ─────────────────────────────────────────────────────────────────
let _mode: 'live' | 'demo' | 'unknown' = 'unknown';
export function getMode() { return _mode; }

// ─── Low-level helpers ──────────────────────────────────────────────────────────

function pick<T = unknown>(obj: any, ...keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function fmtDate(v: any): string {
  if (!v) return '';
  const s = String(v);
  if (s.includes('T')) return s.split('T')[0];
  return s.length > 10 ? s.slice(0, 10) : s;
}

async function request<T = any>(endpoint: string, opts?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      ...opts,
    });

    if (!res.ok) {
      let msg = `Server error (${res.status})`;
      try {
        const body = await res.json();
        msg = body.message || body.error || body.msg || msg;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

function unwrap(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.recordset && Array.isArray(data.recordset)) return data.recordset;
  if (data?.recordsets?.[0]) return data.recordsets[0];
  if (data && typeof data === 'object' && !Array.isArray(data)) return [data];
  return [];
}

// ─── Mappers ────────────────────────────────────────────────────────────────────

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
    status:      (pick<string>(r, 'Status', 'status') ?? 'Scheduled') as Appointment['status'],
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
  let tIds: number[] = [];
  if (r.treatmentIds) tIds = r.treatmentIds;
  else if (r.TreatmentIDs) tIds = r.TreatmentIDs;
  else if (r.treatments && Array.isArray(r.treatments)) {
    tIds = r.treatments.map((t: any) => pick<number>(t, 'TreatmentID', 'treatmentId', 'id') ?? 0);
  }
  return {
    id:           pick<number>(r, 'VisitID', 'visitId', 'visit_id', 'id') ?? 0,
    patientId:    pick<number>(r, 'PatientID', 'patientId', 'patient_id') ?? 0,
    patientName:  pick<string>(r, 'PatientName', 'patientName', 'patient_name') ?? '',
    doctorId:     pick<number>(r, 'DoctorID', 'doctorId', 'doctor_id') ?? 0,
    doctorName:   pick<string>(r, 'DoctorName', 'doctorName', 'doctor_name') ?? '',
    date:         fmtDate(pick(r, 'VisitDate', 'visitDate', 'Date', 'date', 'visit_date')),
    diagnosis:    pick<string>(r, 'Diagnosis', 'diagnosis') ?? '',
    notes:        pick<string>(r, 'Notes', 'notes') ?? '',
    treatmentIds: tIds,
    status:       (pick<string>(r, 'Status', 'status') ?? 'In Progress') as Visit['status'],
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
    status:      (pick<string>(r, 'Status', 'status') ?? 'Unpaid') as Invoice['status'],
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
    password:  '',
    createdAt: fmtDate(pick(r, 'CreatedAt', 'createdAt', 'created_at')),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HEALTH CHECK — determines live vs demo mode
// ═══════════════════════════════════════════════════════════════════════════════

export async function healthCheck(): Promise<'live' | 'demo'> {
  try {
    await request('/health');
    _mode = 'live';
    return 'live';
  } catch {
    // Try a simpler GET to see if server is up but /health doesn't exist
    try {
      await request('/patients');
      _mode = 'live';
      return 'live';
    } catch {
      _mode = 'demo';
      return 'demo';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH — tries multiple endpoints, falls back gracefully
// ═══════════════════════════════════════════════════════════════════════════════

export async function apiLogin(email: string, password: string): Promise<User> {
  // Try /auth/login
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const raw = data?.user || data?.data || data;
    return mapUser(raw);
  } catch {
    // /auth/login doesn't exist — try /login
    try {
      const data = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const raw = data?.user || data?.data || data;
      return mapUser(raw);
    } catch {
      // No auth endpoints at all — thrown error will be caught by caller
      throw new Error('Login endpoint not available on this server');
    }
  }
}

export async function apiRegister(body: {
  name: string; email: string; password: string; role: string; phone: string;
}): Promise<User> {
  try {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const raw = data?.user || data?.data || data;
    return mapUser(raw);
  } catch {
    try {
      const data = await request('/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const raw = data?.user || data?.data || data;
      return mapUser(raw);
    } catch {
      throw new Error('Register endpoint not available on this server');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LIVE API CALLS
// ═══════════════════════════════════════════════════════════════════════════════

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
      assignedDoctor: p.assignedDoctor || null,
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
      assignedDoctor: p.assignedDoctor || null,
    })
  });
}
export async function deletePatientApi(id: number): Promise<void> {
  await request(`/patients/${id}`, { method: 'DELETE' });
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const data = await request('/doctors');
  return unwrap(data).map(mapDoctor);
}
export async function createDoctor(d: Omit<Doctor, 'id'>): Promise<Doctor> {
  const data = await request('/doctors', { method: 'POST', body: JSON.stringify({ name: d.name, specialty: d.specialty, phone: d.phone, email: d.email, workingHours: d.workingHours }) });
  return mapDoctor(data?.data || data);
}
export async function updateDoctorApi(id: number, d: Partial<Doctor>): Promise<void> {
  await request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify({ name: d.name, specialty: d.specialty, phone: d.phone, email: d.email, workingHours: d.workingHours }) });
}
export async function deleteDoctorApi(id: number): Promise<void> {
  await request(`/doctors/${id}`, { method: 'DELETE' });
}

export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const data = await request('/dashboard/appointments-with-names');
    return unwrap(data).map(mapAppointment);
  } catch {
    const data = await request('/appointments');
    return unwrap(data).map(mapAppointment);
  }
}
export async function createAppointment(a: { patientId: number; doctorId: number; date: string; time: string; status: string; reason: string }): Promise<Appointment> {
  const data = await request('/appointments', { method: 'POST', body: JSON.stringify({ patientId: a.patientId, doctorId: a.doctorId, appointmentDate: a.date, appointmentTime: a.time, status: a.status, reason: a.reason }) });
  return mapAppointment(data?.data || data);
}
export async function updateAppointmentApi(id: number, fields: Record<string, any>): Promise<void> {
  await request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}
export async function deleteAppointmentApi(id: number): Promise<void> {
  await request(`/appointments/${id}`, { method: 'DELETE' });
}

export async function fetchTreatments(): Promise<Treatment[]> {
  const data = await request('/treatments');
  return unwrap(data).map(mapTreatment);
}
export async function createTreatmentApi(t: Omit<Treatment, 'id'>): Promise<Treatment> {
  const data = await request('/treatments', { method: 'POST', body: JSON.stringify({ name: t.name, description: t.description, cost: t.cost, duration: t.duration, category: t.category }) });
  return mapTreatment(data?.data || data);
}
export async function updateTreatmentApi(id: number, t: Partial<Treatment>): Promise<void> {
  await request(`/treatments/${id}`, { method: 'PUT', body: JSON.stringify({ name: t.name, description: t.description, cost: t.cost, duration: t.duration, category: t.category }) });
}
export async function deleteTreatmentApi(id: number): Promise<void> {
  await request(`/treatments/${id}`, { method: 'DELETE' });
}

export async function fetchVisits(): Promise<Visit[]> {
  const data = await request('/visits');
  const visits = unwrap(data).map(mapVisit);
  await Promise.allSettled(visits.map(async (v) => {
    try { const tData = await request(`/visits/${v.id}/treatments`); v.treatmentIds = unwrap(tData).map((t: any) => pick<number>(t, 'TreatmentID', 'treatmentId', 'id') ?? 0); } catch {}
  }));
  return visits;
}
export async function createVisitApi(v: { patientId: number; doctorId: number; date: string; diagnosis: string; notes: string; status: string; treatmentIds: number[] }): Promise<Visit> {
  const data = await request('/visits', { method: 'POST', body: JSON.stringify({ patientId: v.patientId, doctorId: v.doctorId, visitDate: v.date, diagnosis: v.diagnosis, notes: v.notes, status: v.status }) });
  const created = mapVisit(data?.data || data);
  for (const tid of v.treatmentIds) { try { await request(`/visits/${created.id}/treatments`, { method: 'POST', body: JSON.stringify({ treatmentId: tid }) }); } catch {} }
  created.treatmentIds = v.treatmentIds;
  return created;
}
export async function deleteVisitApi(id: number): Promise<void> {
  await request(`/visits/${id}`, { method: 'DELETE' });
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const data = await request('/invoices');
  return unwrap(data).map(mapInvoice);
}
export async function updateInvoiceApi(id: number, fields: Record<string, any>): Promise<void> {
  await request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

export async function fetchPayments(): Promise<Payment[]> {
  const data = await request('/payments');
  return unwrap(data).map(mapPayment);
}
export async function createPaymentApi(p: { invoiceId: number; amount: number; method: string; date: string; notes: string }): Promise<Payment> {
  const data = await request('/payments', { method: 'POST', body: JSON.stringify({ invoiceId: p.invoiceId, amount: p.amount, paymentMethod: p.method, paymentDate: p.date, notes: p.notes }) });
  return mapPayment(data?.data || data);
}

export function resolveNames(appointments: Appointment[], patients: Patient[], doctors: Doctor[]): Appointment[] {
  return appointments.map((a) => ({
    ...a,
    patientName: a.patientName || (() => { const p = patients.find((x) => x.id === a.patientId); return p ? `${p.firstName} ${p.lastName}` : `Patient #${a.patientId}`; })(),
    doctorName: a.doctorName || doctors.find((x) => x.id === a.doctorId)?.name || `Doctor #${a.doctorId}`,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DEMO MODE — Seed data + in-memory CRUD
// ═══════════════════════════════════════════════════════════════════════════════

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const _demo = {
  users: [
    { id: '1', name: 'Admin User', email: 'admin@clinic.com', role: 'receptionist' as const, phone: '555-0001', password: 'admin123', createdAt: '2025-01-01' },
    { id: '2', name: 'Dr. Sarah Johnson', email: 'sarah@clinic.com', role: 'doctor' as const, phone: '555-0101', password: 'doctor123', createdAt: '2025-02-15' },
    { id: '3', name: 'John Smith', email: 'john@email.com', role: 'patient' as const, phone: '555-1001', password: 'patient123', createdAt: '2025-06-01' },
  ] as User[],
  patients: [
    { id: 1, firstName: 'John', lastName: 'Smith', gender: 'Male', dob: '1985-03-15', phone: '555-1001', email: 'john@email.com', address: '123 Main St', medicalHistory: 'No allergies', assignedDoctor: 'Dr. Sarah Johnson' },
    { id: 2, firstName: 'Maria', lastName: 'Garcia', gender: 'Female', dob: '1990-07-22', phone: '555-1002', email: 'maria@email.com', address: '456 Oak Ave', medicalHistory: 'Penicillin allergy', assignedDoctor: 'Dr. Michael Chen' },
    { id: 3, firstName: 'Robert', lastName: 'Williams', gender: 'Male', dob: '1978-11-30', phone: '555-1003', email: 'robert@email.com', address: '789 Pine Rd', medicalHistory: 'Diabetes type 2', assignedDoctor: 'Dr. Emily Davis' },
    { id: 4, firstName: 'Lisa', lastName: 'Brown', gender: 'Female', dob: '1995-01-10', phone: '555-1004', email: 'lisa@email.com', address: '321 Elm St', medicalHistory: 'None', assignedDoctor: 'Dr. Sarah Johnson' },
    { id: 5, firstName: 'David', lastName: 'Martinez', gender: 'Male', dob: '1982-09-05', phone: '555-1005', email: 'david@email.com', address: '654 Cedar Ln', medicalHistory: 'High blood pressure', assignedDoctor: 'Dr. Michael Chen' },
  ] as Patient[],
  doctors: [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'General Dentistry', phone: '555-0101', email: 'sarah@clinic.com', workingHours: 'Mon-Fri 09:00-17:00' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Orthodontics', phone: '555-0102', email: 'michael@clinic.com', workingHours: 'Mon-Thu 10:00-18:00' },
    { id: 3, name: 'Dr. Emily Davis', specialty: 'Periodontics', phone: '555-0103', email: 'emily@clinic.com', workingHours: 'Tue-Sat 08:00-16:00' },
  ] as Doctor[],
  appointments: [
    { id: 1, patientId: 1, patientName: 'John Smith', doctorId: 1, doctorName: 'Dr. Sarah Johnson', date: today, time: '09:00 AM', status: 'Confirmed' as const, reason: 'Routine checkup' },
    { id: 2, patientId: 2, patientName: 'Maria Garcia', doctorId: 2, doctorName: 'Dr. Michael Chen', date: today, time: '10:30 AM', status: 'Scheduled' as const, reason: 'Braces adjustment' },
    { id: 3, patientId: 3, patientName: 'Robert Williams', doctorId: 3, doctorName: 'Dr. Emily Davis', date: today, time: '02:00 PM', status: 'Scheduled' as const, reason: 'Gum treatment' },
    { id: 4, patientId: 4, patientName: 'Lisa Brown', doctorId: 1, doctorName: 'Dr. Sarah Johnson', date: yesterday, time: '11:00 AM', status: 'Completed' as const, reason: 'Teeth whitening' },
    { id: 5, patientId: 5, patientName: 'David Martinez', doctorId: 2, doctorName: 'Dr. Michael Chen', date: tomorrow, time: '03:00 PM', status: 'Scheduled' as const, reason: 'Root canal' },
  ] as Appointment[],
  treatments: [
    { id: 1, name: 'Dental Cleaning', description: 'Professional teeth cleaning', cost: 120, duration: '45 min', category: 'Preventive' },
    { id: 2, name: 'Tooth Filling', description: 'Composite resin filling', cost: 200, duration: '60 min', category: 'Restorative' },
    { id: 3, name: 'Root Canal', description: 'Endodontic treatment', cost: 800, duration: '90 min', category: 'Endodontics' },
    { id: 4, name: 'Teeth Whitening', description: 'Professional whitening', cost: 350, duration: '60 min', category: 'Cosmetic' },
    { id: 5, name: 'Dental Crown', description: 'Porcelain crown placement', cost: 1200, duration: '120 min', category: 'Restorative' },
    { id: 6, name: 'Braces Adjustment', description: 'Monthly tightening', cost: 150, duration: '30 min', category: 'Orthodontics' },
    { id: 7, name: 'Deep Cleaning', description: 'Scaling and root planing', cost: 300, duration: '75 min', category: 'Periodontics' },
    { id: 8, name: 'Tooth Extraction', description: 'Simple extraction', cost: 250, duration: '45 min', category: 'Oral Surgery' },
    { id: 9, name: 'Dental X-Ray', description: 'Full-mouth radiograph', cost: 80, duration: '15 min', category: 'Diagnostic' },
  ] as Treatment[],
  visits: [
    { id: 1, patientId: 4, patientName: 'Lisa Brown', doctorId: 1, doctorName: 'Dr. Sarah Johnson', date: yesterday, diagnosis: 'Mild staining', notes: 'Whitening performed.', treatmentIds: [4], status: 'Completed' as const },
    { id: 2, patientId: 1, patientName: 'John Smith', doctorId: 1, doctorName: 'Dr. Sarah Johnson', date: twoDaysAgo, diagnosis: 'Old filling replaced', notes: 'Composite filling placed.', treatmentIds: [2, 9], status: 'Completed' as const },
  ] as Visit[],
  invoices: [
    { id: 1, patientId: 1, patientName: 'John Smith', total: 280, discount: 0, final: 280, status: 'Paid' as const, createdAt: twoDaysAgo },
    { id: 2, patientId: 2, patientName: 'Maria Garcia', total: 1500, discount: 150, final: 1350, status: 'Partial' as const, createdAt: '2026-01-10' },
    { id: 3, patientId: 3, patientName: 'Robert Williams', total: 380, discount: 0, final: 380, status: 'Unpaid' as const, createdAt: '2026-01-08' },
    { id: 4, patientId: 4, patientName: 'Lisa Brown', total: 350, discount: 35, final: 315, status: 'Paid' as const, createdAt: yesterday },
  ] as Invoice[],
  payments: [
    { id: 1, invoiceId: 1, patientName: 'John Smith', amount: 280, method: 'Card', date: twoDaysAgo, notes: 'Full payment' },
    { id: 2, invoiceId: 2, patientName: 'Maria Garcia', amount: 500, method: 'Cash', date: '2026-01-10', notes: 'First installment' },
    { id: 3, invoiceId: 4, patientName: 'Lisa Brown', amount: 315, method: 'Insurance', date: yesterday, notes: 'Insurance covered' },
  ] as Payment[],
};

// Deep-clone so mutations don't corrupt the seed
function clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

export const demo = {
  login(email: string, password: string): User | null {
    return _demo.users.find(u => u.email === email && u.password === password) || null;
  },
  register(data: { name: string; email: string; password: string; role: string; phone: string }): User {
    const u: User = { id: String(Date.now()), name: data.name, email: data.email, role: data.role as User['role'], phone: data.phone, password: data.password, createdAt: today };
    _demo.users.push(u);
    return u;
  },
  fetchAll() {
    return {
      patients: clone(_demo.patients),
      doctors: clone(_demo.doctors),
      appointments: clone(_demo.appointments),
      treatments: clone(_demo.treatments),
      visits: clone(_demo.visits),
      invoices: clone(_demo.invoices),
      payments: clone(_demo.payments),
    };
  },
  addPatient(p: Patient)   { const np = { ...p, id: Date.now() }; _demo.patients.push(np); return clone(_demo.patients); },
  updatePatient(p: Patient){ _demo.patients = _demo.patients.map(x => x.id === p.id ? p : x); return clone(_demo.patients); },
  deletePatient(id: number){ _demo.patients = _demo.patients.filter(x => x.id !== id); return clone(_demo.patients); },
  addDoctor(d: Doctor)     { const nd = { ...d, id: Date.now() }; _demo.doctors.push(nd); return clone(_demo.doctors); },
  updateDoctor(d: Doctor)  { _demo.doctors = _demo.doctors.map(x => x.id === d.id ? d : x); return clone(_demo.doctors); },
  deleteDoctor(id: number) { _demo.doctors = _demo.doctors.filter(x => x.id !== id); return clone(_demo.doctors); },
  addAppointment(a: Appointment){ const na = { ...a, id: Date.now() }; _demo.appointments.push(na); return clone(_demo.appointments); },
  deleteAppointment(id: number) { _demo.appointments = _demo.appointments.filter(x => x.id !== id); return clone(_demo.appointments); },
  updateAppointmentStatus(id: number, s: Appointment['status']){ _demo.appointments = _demo.appointments.map(x => x.id === id ? { ...x, status: s } : x); return clone(_demo.appointments); },
  addTreatment(t: Treatment){ const nt = { ...t, id: Date.now() }; _demo.treatments.push(nt); return clone(_demo.treatments); },
  updateTreatment(t: Treatment){ _demo.treatments = _demo.treatments.map(x => x.id === t.id ? t : x); return clone(_demo.treatments); },
  deleteTreatment(id: number){ _demo.treatments = _demo.treatments.filter(x => x.id !== id); return clone(_demo.treatments); },
  addVisit(v: Visit){ const nv = { ...v, id: Date.now() }; _demo.visits.push(nv); return clone(_demo.visits); },
  deleteVisit(id: number){ _demo.visits = _demo.visits.filter(x => x.id !== id); return clone(_demo.visits); },
  addPayment(p: Payment){ const np = { ...p, id: Date.now() }; _demo.payments.push(np); return clone(_demo.payments); },
  getInvoices(){ return clone(_demo.invoices); },
  updateInvoiceStatus(id: number, s: Invoice['status']){ _demo.invoices = _demo.invoices.map(x => x.id === id ? { ...x, status: s } : x); return clone(_demo.invoices); },
};
