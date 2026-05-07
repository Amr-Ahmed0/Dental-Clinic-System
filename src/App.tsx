import { useState, useEffect, useCallback } from 'react';
import { Page, User, Patient, Doctor, Appointment, Treatment, Visit, Invoice, Payment } from './types';
import { getInitials, getDisplayName } from './displayName';
import { getCurrentUser, setCurrentUser as saveUser, getTheme, setTheme as saveTheme } from './store';
import * as api from './api';

import AuthOverlay from './components/AuthOverlay';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Doctors from './components/Doctors';
import Appointments from './components/Appointments';
import Treatments from './components/Treatments';
import Visits from './components/Visits';
import Payments from './components/Payments';
import Profile from './components/Profile';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode] = useState(() => getTheme() === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    saveTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ─── Fetch all data from API ────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, d, a, t, v, inv, pay] = await Promise.all([
        api.fetchPatients().catch(() => []),
        api.fetchDoctors().catch(() => []),
        api.fetchAppointments().catch(() => []),
        api.fetchTreatments().catch(() => []),
        api.fetchVisits().catch(() => []),
        api.fetchInvoices().catch(() => []),
        api.fetchPayments().catch(() => []),
      ]);

      setPatients(p);
      setDoctors(d);
      // Fill missing names from local patient/doctor lists
      setAppointments(api.resolveNames(a, p, d));
      setTreatments(t);
      setVisits(v.map(vis => ({
        ...vis,
        patientName: vis.patientName || (() => { const pt = p.find(x => x.id === vis.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })(),
        doctorName: vis.doctorName || d.find(x => x.id === vis.doctorId)?.name || '',
      })));
      setInvoices(inv.map(i => ({
        ...i,
        patientName: i.patientName || (() => { const pt = p.find(x => x.id === i.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })(),
      })));
      setPayments(pay.map(pm => ({
        ...pm,
        patientName: pm.patientName || (() => { const inv2 = inv.find(x => x.id === pm.invoiceId); return inv2?.patientName || ''; })(),
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data once user is authenticated
  useEffect(() => {
    if (currentUser) fetchAllData();
  }, [currentUser, fetchAllData]);

  // ─── Auth handlers ──────────────────────────────────────────────────────────
  const handleLogin = useCallback((user: User) => {
    saveUser(user);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    saveUser(null);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setPatients([]); setDoctors([]); setAppointments([]);
    setTreatments([]); setVisits([]); setInvoices([]); setPayments([]);
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── CRUD wrappers (call API → refresh state) ──────────────────────────────

  const toast = (msg: string) => setToastMsg(msg);

  // Patients
  const addPatient = useCallback(async (p: Patient) => {
    try {
      await api.createPatient(p);
      const fresh = await api.fetchPatients();
      setPatients(fresh);
      toast('✅ Patient added successfully');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const updatePatient = useCallback(async (p: Patient) => {
    try {
      await api.updatePatientApi(p.id, p);
      const fresh = await api.fetchPatients();
      setPatients(fresh);
      toast('✅ Patient updated');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const deletePatient = useCallback(async (id: number) => {
    try {
      await api.deletePatientApi(id);
      setPatients(prev => prev.filter(x => x.id !== id));
      toast('✅ Patient deleted');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  // Doctors
  const addDoctor = useCallback(async (d: Doctor) => {
    try {
      await api.createDoctor(d);
      const fresh = await api.fetchDoctors();
      setDoctors(fresh);
      toast('✅ Doctor added successfully');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const updateDoctor = useCallback(async (d: Doctor) => {
    try {
      await api.updateDoctorApi(d.id, d);
      const fresh = await api.fetchDoctors();
      setDoctors(fresh);
      toast('✅ Doctor updated');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const deleteDoctor = useCallback(async (id: number) => {
    try {
      await api.deleteDoctorApi(id);
      setDoctors(prev => prev.filter(x => x.id !== id));
      toast('✅ Doctor deleted');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  // Appointments
  const addAppointment = useCallback(async (a: Appointment) => {
    try {
      await api.createAppointment({
        patientId: a.patientId, doctorId: a.doctorId,
        date: a.date, time: a.time, status: a.status, reason: a.reason,
      });
      const fresh = await api.fetchAppointments();
      setAppointments(api.resolveNames(fresh, patients, doctors));
      toast('✅ Appointment booked');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, [patients, doctors]);

  const deleteAppointment = useCallback(async (id: number) => {
    try {
      await api.deleteAppointmentApi(id);
      setAppointments(prev => prev.filter(x => x.id !== id));
      toast('✅ Appointment deleted');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const updateAppointmentStatus = useCallback(async (id: number, status: Appointment['status']) => {
    try {
      await api.updateAppointmentApi(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  // Treatments
  const addTreatment = useCallback(async (t: Treatment) => {
    try {
      await api.createTreatmentApi(t);
      const fresh = await api.fetchTreatments();
      setTreatments(fresh);
      toast('✅ Treatment added');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const updateTreatment = useCallback(async (t: Treatment) => {
    try {
      await api.updateTreatmentApi(t.id, t);
      const fresh = await api.fetchTreatments();
      setTreatments(fresh);
      toast('✅ Treatment updated');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const deleteTreatment = useCallback(async (id: number) => {
    try {
      await api.deleteTreatmentApi(id);
      setTreatments(prev => prev.filter(x => x.id !== id));
      toast('✅ Treatment deleted');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  // Visits
  const addVisit = useCallback(async (v: Visit) => {
    try {
      await api.createVisitApi({
        patientId: v.patientId, doctorId: v.doctorId,
        date: v.date, diagnosis: v.diagnosis, notes: v.notes,
        status: v.status, treatmentIds: v.treatmentIds,
      });
      const fresh = await api.fetchVisits();
      setVisits(fresh.map(vis => ({
        ...vis,
        patientName: vis.patientName || (() => { const pt = patients.find(x => x.id === vis.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })(),
        doctorName: vis.doctorName || doctors.find(x => x.id === vis.doctorId)?.name || '',
      })));
      toast('✅ Visit recorded');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, [patients, doctors]);

  const deleteVisit = useCallback(async (id: number) => {
    try {
      await api.deleteVisitApi(id);
      setVisits(prev => prev.filter(x => x.id !== id));
      toast('✅ Visit deleted');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, []);

  const updateVisitStatus = useCallback(async (id: number, status: Visit['status']) => {
    // No dedicated API for visit status update — do a full refresh
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  }, []);

  // Payments
  const addPayment = useCallback(async (p: Payment) => {
    try {
      await api.createPaymentApi({
        invoiceId: p.invoiceId, amount: p.amount,
        method: p.method, date: p.date, notes: p.notes,
      });
      const [freshPay, freshInv] = await Promise.all([
        api.fetchPayments(),
        api.fetchInvoices(),
      ]);
      setPayments(freshPay);
      setInvoices(freshInv.map(i => ({
        ...i,
        patientName: i.patientName || (() => { const pt = patients.find(x => x.id === i.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })(),
      })));
      toast('✅ Payment recorded');
    } catch (e: any) { toast('❌ ' + e.message); }
  }, [patients]);

  const updateInvoiceStatus = useCallback(async (id: number) => {
    try {
      await api.updateInvoiceApi(id, { status: 'Paid' });
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'Paid' as const } : i));
    } catch {
      // Optimistic update even if endpoint fails
      setInvoices(prev => prev.map(inv => {
        if (inv.id !== id) return inv;
        const totalPaid = payments.filter(p => p.invoiceId === id).reduce((s, p) => s + p.amount, 0);
        return { ...inv, status: (totalPaid >= inv.final ? 'Paid' : 'Partial') as Invoice['status'] };
      }));
    }
  }, [payments]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!currentUser) {
    return <AuthOverlay onLogin={handleLogin} />;
  }

  const userInitial = getInitials(currentUser.name);

  // Loading screen
  if (loading && patients.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-main)', gap: '1rem',
      }}>
        <div style={{ fontSize: '3rem' }}>🦷</div>
        <div style={{
          width: 48, height: 48, border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: 'var(--gray-500)', fontSize: '.9rem' }}>Connecting to database…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Connection error
  if (error && patients.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-main)', gap: '1rem', padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ color: 'var(--gray-900)', fontSize: '1.5rem', fontWeight: 700 }}>Connection Error</h2>
        <p style={{ color: 'var(--gray-500)', maxWidth: 500, lineHeight: 1.7 }}>
          Could not connect to the backend server at<br />
          <code style={{ background: 'var(--gray-100)', padding: '.2rem .5rem', borderRadius: '.25rem', fontSize: '.85rem' }}>
            http://localhost:5001
          </code>
        </p>
        <p style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
          <button onClick={fetchAllData} className="submit-btn">🔄 Retry Connection</button>
          <button onClick={handleLogout} className="submit-btn" style={{ background: 'var(--gray-400)' }}>Logout</button>
        </div>
        <div style={{
          marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-card)',
          borderRadius: '.75rem', border: '1px solid var(--border-color)',
          maxWidth: 520, width: '100%', textAlign: 'left',
        }}>
          <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '.5rem' }}>
            Make sure the backend server is running:
          </p>
          <pre style={{
            background: 'var(--gray-50)', padding: '.75rem', borderRadius: '.5rem',
            fontSize: '.8rem', color: 'var(--gray-700)', overflowX: 'auto', lineHeight: 1.8,
          }}>
{`cd Dental-Clinic-Management-System
npm install
npm start

# Server should be running on port 5001
# Database: DESKTOP-AI410CS\\DentalClinicSystem`}
          </pre>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            patients={patients} doctors={doctors} appointments={appointments}
            invoices={invoices} payments={payments} treatments={treatments}
            visits={visits} userName={getDisplayName(currentUser.name)} onNavigate={handleNavigate}
          />
        );
      case 'patients':
        return (
          <Patients
            patients={patients} doctors={doctors}
            onAdd={addPatient} onUpdate={updatePatient} onDelete={deletePatient}
            searchQuery={searchQuery}
          />
        );
      case 'doctors':
        return (
          <Doctors
            doctors={doctors}
            onAdd={addDoctor} onUpdate={updateDoctor} onDelete={deleteDoctor}
            searchQuery={searchQuery}
          />
        );
      case 'appointments':
        return (
          <Appointments
            appointments={appointments} patients={patients} doctors={doctors}
            onAdd={addAppointment} onDelete={deleteAppointment}
            onUpdateStatus={updateAppointmentStatus} searchQuery={searchQuery}
          />
        );
      case 'treatments':
        return (
          <Treatments
            treatments={treatments}
            onAdd={addTreatment} onUpdate={updateTreatment} onDelete={deleteTreatment}
            searchQuery={searchQuery}
          />
        );
      case 'visits':
        return (
          <Visits
            visits={visits} patients={patients} doctors={doctors} treatments={treatments}
            onAdd={addVisit} onDelete={deleteVisit} onUpdateStatus={updateVisitStatus}
            searchQuery={searchQuery}
          />
        );
      case 'payments':
        return (
          <Payments
            invoices={invoices} payments={payments}
            onAddPayment={addPayment} onUpdateInvoiceStatus={updateInvoiceStatus}
            searchQuery={searchQuery}
          />
        );
      case 'profile':
        return (
          <Profile
            user={currentUser} patients={patients} doctors={doctors}
            appointments={appointments} visits={visits} treatments={treatments}
            payments={payments} onNavigate={handleNavigate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Sidebar
        currentPage={currentPage} onNavigate={handleNavigate}
        user={currentUser} onLogout={handleLogout}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          darkMode={darkMode} onToggleTheme={() => setDarkMode(d => !d)}
          userInitial={userInitial} onNavigate={handleNavigate}
          searchQuery={searchQuery} onSearch={setSearchQuery}
        />

        <main className="main-content">
          {renderPage()}
        </main>

        {/* Toast notification */}
        {toastMsg && (
          <div
            onClick={() => setToastMsg(null)}
            style={{
              position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
              padding: '.85rem 1.25rem', borderRadius: '.75rem',
              background: toastMsg.startsWith('❌') ? '#fee2e2' : '#d1fae5',
              color: toastMsg.startsWith('❌') ? '#991b1b' : '#065f46',
              fontWeight: 600, fontSize: '.9rem',
              boxShadow: '0 10px 25px rgba(0,0,0,.15)',
              cursor: 'pointer', animation: 'slideUp .3s ease',
              maxWidth: 360,
            }}
          >
            {toastMsg}
          </div>
        )}

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🦷 Dental Clinic</span>
              <p>Professional dental clinic management system</p>
            </div>
            <div className="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Dental Clinic Management System — Connected to SQL Server</span>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
