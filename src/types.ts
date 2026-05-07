export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'receptionist';
  phone: string;
  password: string;
  createdAt: string;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  assignedDoctor: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  workingHours: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-Show';
  reason: string;
}

export interface Treatment {
  id: number;
  name: string;
  description: string;
  cost: number;
  duration: string;
  category: string;
}

export interface Visit {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
  diagnosis: string;
  notes: string;
  treatmentIds: number[];
  status: 'In Progress' | 'Completed' | 'Follow-Up Required';
}

export interface Invoice {
  id: number;
  patientId: number;
  patientName: string;
  total: number;
  discount: number;
  final: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  createdAt: string;
}

export interface Payment {
  id: number;
  invoiceId: number;
  patientName: string;
  amount: number;
  method: string;
  date: string;
  notes: string;
}

export type Page = 'dashboard' | 'patients' | 'doctors' | 'appointments' | 'treatments' | 'visits' | 'payments' | 'profile';
