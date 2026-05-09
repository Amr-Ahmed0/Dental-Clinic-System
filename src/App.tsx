import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Page, User, Patient, Doctor, Appointment, Treatment, Visit, Invoice, Payment } from './types';
import { getInitials, getDisplayName } from './utils/displayName';
import { getCurrentUser, setCurrentUser as saveUser, getTheme, setTheme as saveTheme } from './store';
import { getPermissions, Permissions } from './permissions';
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
  const modeRef = useRef<'live' | 'demo'>('demo');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => { if (!toastMsg) return; const t = setTimeout(() => setToastMsg(null), 4000); return () => clearTimeout(t); }, [toastMsg]);
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); saveTheme(darkMode ? 'dark' : 'light'); }, [darkMode]);

  const toast = (msg: string) => setToastMsg(msg);
  const isLive = () => modeRef.current === 'live';

  // ─── Permissions ────────────────────────────────────────────────────────────
  const perms: Permissions = useMemo(
    () => getPermissions(currentUser?.role ?? 'patient'),
    [currentUser?.role]
  );

  // ─── Role-based data filtering ─────────────────────────────────────────────
  // Find the doctor/patient record that matches the current user
  const myDoctorId = useMemo(() => {
    if (currentUser?.role !== 'doctor') return null;
    const doc = doctors.find(d => d.email === currentUser.email || d.name === currentUser.name);
    return doc?.id ?? null;
  }, [currentUser, doctors]);

  const myPatientId = useMemo(() => {
    if (currentUser?.role !== 'patient') return null;

    const normalize = (v: string) =>
      v.trim().toLowerCase().replace(/\s+/g, ' ');

    const userDisplayName = normalize(getDisplayName(currentUser.name));

    const pat = patients.find(p => {
      const fullName = normalize(`${p.firstName} ${p.lastName}`);
      return p.email === currentUser.email || fullName === userDisplayName;
    });

    return pat?.id ?? null;
  }, [currentUser, patients]);

  // Filtered data based on role
  const filteredPatients = useMemo(() => {
    if (perms.patients.viewAll) return patients;
    if (currentUser?.role === 'doctor' && myDoctorId) {
      const docName = doctors.find(d => d.id === myDoctorId)?.name ?? '';
      return patients.filter(p => p.assignedDoctor === docName);
    }
    if (currentUser?.role === 'patient' && myPatientId)
      return patients.filter(p => p.id === myPatientId);
    return [];
  }, [patients, perms, currentUser, myDoctorId, myPatientId, doctors]);

  const filteredDoctors = useMemo(() => {
    if (perms.doctors.viewAll) return doctors;
    if (currentUser?.role === 'patient') {
      const myPat = patients.find(p => p.id === myPatientId);
      if (myPat?.assignedDoctor) return doctors.filter(d => d.name === myPat.assignedDoctor);
    }
    return doctors;
  }, [doctors, perms, currentUser, patients, myPatientId]);

  const filteredAppointments = useMemo(() => {
    if (perms.appointments.viewAll) return appointments;
    if (currentUser?.role === 'doctor' && myDoctorId)
      return appointments.filter(a => a.doctorId === myDoctorId);
    if (currentUser?.role === 'patient' && myPatientId)
      return appointments.filter(a => a.patientId === myPatientId);
    return [];
  }, [appointments, perms, currentUser, myDoctorId, myPatientId]);

  const filteredVisits = useMemo(() => {
    if (perms.visits.viewAll) return visits;
    if (currentUser?.role === 'doctor' && myDoctorId)
      return visits.filter(v => v.doctorId === myDoctorId);
    if (currentUser?.role === 'patient' && myPatientId)
      return visits.filter(v => v.patientId === myPatientId);
    return [];
  }, [visits, perms, currentUser, myDoctorId, myPatientId]);

  const filteredInvoices = useMemo(() => {
    if (perms.invoices.viewAll) return invoices;
    if (currentUser?.role === 'patient' && myPatientId)
      return invoices.filter(i => i.patientId === myPatientId);
    return [];
  }, [invoices, perms, currentUser, myPatientId]);

  const filteredPayments = useMemo(() => {
    if (perms.payments.viewAll) return payments;
    if (currentUser?.role === 'patient' && myPatientId) {
      const myInvIds = new Set(filteredInvoices.map(i => i.id));
      return payments.filter(p => myInvIds.has(p.invoiceId));
    }
    return [];
  }, [payments, perms, currentUser, myPatientId, filteredInvoices]);

  const currentPatientRecord = useMemo(
    () => (myPatientId ? patients.find(p => p.id === myPatientId) ?? null : null),
    [patients, myPatientId]
  );

  // ─── Data loading ──────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    if (isLive()) {
      try {
        const [p, d, a, t, v, inv, pay] = await Promise.all([
          api.fetchPatients().catch(() => []), api.fetchDoctors().catch(() => []),
          api.fetchAppointments().catch(() => []), api.fetchTreatments().catch(() => []),
          api.fetchVisits().catch(() => []), api.fetchInvoices().catch(() => []),
          api.fetchPayments().catch(() => []),
        ]);
        setPatients(p); setDoctors(d);
        setAppointments(api.resolveNames(a, p, d));
        setTreatments(t);
        setVisits(v.map(vis => ({ ...vis, patientName: vis.patientName || (() => { const pt = p.find(x => x.id === vis.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })(), doctorName: vis.doctorName || d.find(x => x.id === vis.doctorId)?.name || '' })));
        setInvoices(inv.map(i => ({ ...i, patientName: i.patientName || (() => { const pt = p.find(x => x.id === i.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })() })));
        setPayments(pay.map(pm => ({ ...pm, patientName: pm.patientName || (() => { const inv2 = inv.find(x => x.id === pm.invoiceId); return inv2?.patientName || ''; })() })));
      } catch { toast('⚠️ Server unreachable — Demo Mode'); modeRef.current = 'demo'; loadDemoData(); }
    } else { loadDemoData(); }
    setLoading(false);
  }, []);

  const loadDemoData = () => { const d = api.demo.fetchAll(); setPatients(d.patients); setDoctors(d.doctors); setAppointments(d.appointments); setTreatments(d.treatments); setVisits(d.visits); setInvoices(d.invoices); setPayments(d.payments); };

  useEffect(() => { if (currentUser) fetchAllData(); }, [currentUser, fetchAllData]);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = useCallback((user: User, mode: 'live' | 'demo') => { modeRef.current = mode; saveUser(user); setCurrentUser(user); }, []);
  const handleLogout = useCallback(() => { saveUser(null); setCurrentUser(null); setCurrentPage('dashboard'); setPatients([]); setDoctors([]); setAppointments([]); setTreatments([]); setVisits([]); setInvoices([]); setPayments([]); }, []);

  const handleNavigate = useCallback((page: Page) => {
    // Prevent navigation to unauthorized pages
    if (!perms.pages.includes(page) && page !== 'profile') {
      toast('🔒 You don\'t have access to this page');
      return;
    }
    setCurrentPage(page);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [perms]);

  // ─── CRUD with permission checks ──────────────────────────────────────────

  const addPatient = useCallback(async (p: Patient) => {
    if (!perms.patients.add) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.createPatient(p); setPatients(await api.fetchPatients()); toast('✅ Patient added'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setPatients(api.demo.addPatient(p)); toast('✅ Patient added'); }
  }, [perms]);
  const updatePatient = useCallback(async (p: Patient) => {
    if (!perms.patients.edit) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.updatePatientApi(p.id, p); setPatients(await api.fetchPatients()); toast('✅ Updated'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setPatients(api.demo.updatePatient(p)); toast('✅ Updated'); }
  }, [perms]);
  const deletePatient = useCallback(async (id: number) => {
    if (!perms.patients.delete) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.deletePatientApi(id); setPatients(prev => prev.filter(x => x.id !== id)); toast('✅ Deleted'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setPatients(api.demo.deletePatient(id)); toast('✅ Deleted'); }
  }, [perms]);

  const addDoctor = useCallback(async (d: Doctor) => {
    if (!perms.doctors.add) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.createDoctor(d); setDoctors(await api.fetchDoctors()); toast('✅ Doctor added'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setDoctors(api.demo.addDoctor(d)); toast('✅ Doctor added'); }
  }, [perms]);
  const updateDoctor = useCallback(async (d: Doctor) => {
    if (!perms.doctors.edit) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.updateDoctorApi(d.id, d); setDoctors(await api.fetchDoctors()); toast('✅ Updated'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setDoctors(api.demo.updateDoctor(d)); toast('✅ Updated'); }
  }, [perms]);
  const deleteDoctor = useCallback(async (id: number) => {
    if (!perms.doctors.delete) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.deleteDoctorApi(id); setDoctors(prev => prev.filter(x => x.id !== id)); toast('✅ Deleted'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setDoctors(api.demo.deleteDoctor(id)); toast('✅ Deleted'); }
  }, [perms]);

  const addAppointment = useCallback(async (a: Appointment) => {
    if (!perms.appointments.add) { toast('🔒 Permission denied'); return; }

    // If current user is a patient and still has no linked patient record,
    // auto-create a patient profile first, then book the appointment.
    let resolvedPatientId = a.patientId;
    let resolvedPatientName = a.patientName;

    if (currentUser?.role === 'patient' && !resolvedPatientId) {
      const fullName = (getDisplayName(currentUser.name) || 'Patient').trim();
      const parts = fullName.split(/\s+/);
      const firstName = parts[0] || 'Patient';
      const lastName = parts.slice(1).join(' ') || 'User';

      if (isLive()) {
        try {
          const createdPatient = await api.createPatient({
            firstName,
            lastName,
            gender: '',
            dob: '',
            phone: currentUser.phone || '',
            email: currentUser.email || '',
            address: '',
            medicalHistory: '',
            assignedDoctor: doctors.find(d => d.id === a.doctorId)?.name || '',
          });
          resolvedPatientId = createdPatient.id;
          resolvedPatientName = `${createdPatient.firstName} ${createdPatient.lastName}`;
          setPatients(await api.fetchPatients());
        } catch (e: any) {
          toast('❌ Failed to prepare patient profile: ' + e.message);
          return;
        }
      } else {
        const createdList = api.demo.addPatient({
          id: 0,
          firstName,
          lastName,
          gender: '',
          dob: '',
          phone: currentUser.phone || '',
          email: currentUser.email || '',
          address: '',
          medicalHistory: '',
          assignedDoctor: doctors.find(d => d.id === a.doctorId)?.name || '',
        });
        setPatients(createdList);
        const createdPatient = createdList[createdList.length - 1];
        resolvedPatientId = createdPatient.id;
        resolvedPatientName = `${createdPatient.firstName} ${createdPatient.lastName}`;
      }
    }

    if (isLive()) {
      try {
        await api.createAppointment({ patientId: resolvedPatientId, doctorId: a.doctorId, date: a.date, time: a.time, status: a.status, reason: a.reason });
        const fresh = await api.fetchAppointments();
        setAppointments(api.resolveNames(fresh, patients, doctors));
        toast('✅ Booked');
      } catch (e: any) {
        toast('❌ ' + e.message);
      }
    } else {
      setAppointments(api.demo.addAppointment({ ...a, patientId: resolvedPatientId, patientName: resolvedPatientName }));
      toast('✅ Booked');
    }
  }, [patients, doctors, perms, currentUser]);
  const deleteAppointment = useCallback(async (id: number) => {
    if (!perms.appointments.delete) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.deleteAppointmentApi(id); setAppointments(prev => prev.filter(x => x.id !== id)); toast('✅ Deleted'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setAppointments(api.demo.deleteAppointment(id)); toast('✅ Deleted'); }
  }, [perms]);
  const updateAppointmentStatus = useCallback(async (id: number, status: Appointment['status']) => {
    if (!perms.appointments.edit) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.updateAppointmentApi(id, { status }); setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a)); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setAppointments(api.demo.updateAppointmentStatus(id, status)); }
  }, [perms]);

  const addTreatment = useCallback(async (t: Treatment) => {
    if (!perms.treatments.add) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.createTreatmentApi(t); setTreatments(await api.fetchTreatments()); toast('✅ Added'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setTreatments(api.demo.addTreatment(t)); toast('✅ Added'); }
  }, [perms]);
  const updateTreatment = useCallback(async (t: Treatment) => {
    if (!perms.treatments.edit) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.updateTreatmentApi(t.id, t); setTreatments(await api.fetchTreatments()); toast('✅ Updated'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setTreatments(api.demo.updateTreatment(t)); toast('✅ Updated'); }
  }, [perms]);
  const deleteTreatment = useCallback(async (id: number) => {
    if (!perms.treatments.delete) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.deleteTreatmentApi(id); setTreatments(prev => prev.filter(x => x.id !== id)); toast('✅ Deleted'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setTreatments(api.demo.deleteTreatment(id)); toast('✅ Deleted'); }
  }, [perms]);

  const addVisit = useCallback(async (v: Visit) => {
    if (!perms.visits.add) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.createVisitApi({ patientId: v.patientId, doctorId: v.doctorId, date: v.date, diagnosis: v.diagnosis, notes: v.notes, status: v.status, treatmentIds: v.treatmentIds }); const fresh = await api.fetchVisits(); setVisits(fresh.map(vis => ({ ...vis, patientName: vis.patientName || (() => { const pt = patients.find(x => x.id === vis.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })(), doctorName: vis.doctorName || doctors.find(x => x.id === vis.doctorId)?.name || '' }))); toast('✅ Recorded'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setVisits(api.demo.addVisit(v)); toast('✅ Recorded'); }
  }, [patients, doctors, perms]);
  const deleteVisit = useCallback(async (id: number) => {
    if (!perms.visits.delete) { toast('🔒 Permission denied'); return; }
    if (isLive()) { try { await api.deleteVisitApi(id); setVisits(prev => prev.filter(x => x.id !== id)); toast('✅ Deleted'); } catch (e: any) { toast('❌ ' + e.message); } }
    else { setVisits(api.demo.deleteVisit(id)); toast('✅ Deleted'); }
  }, [perms]);
  const updateVisitStatus = useCallback((_id: number, status: Visit['status']) => { setVisits(prev => prev.map(v => v.id === _id ? { ...v, status } : v)); }, []);

  const addPayment = useCallback(async (p: Payment, invoiceId: number) => {
    if (!perms.payments.add) { toast('🔒 Permission denied'); return; }
    if (isLive()) {
      try {
        await api.createPaymentApi({ invoiceId: p.invoiceId, amount: p.amount, method: p.method, date: p.date, notes: p.notes });
        const [freshPay, freshInv] = await Promise.all([api.fetchPayments(), api.fetchInvoices()]);
        setPayments(freshPay);
        setInvoices(freshInv.map(i => ({ ...i, patientName: i.patientName || (() => { const pt = patients.find(x => x.id === i.patientId); return pt ? `${pt.firstName} ${pt.lastName}` : ''; })() })));
        toast('✅ Payment recorded');
      } catch (e: any) { toast('❌ ' + e.message); }
    } else {
      // Demo mode: add payment, then recalculate invoice status
      const freshPayments = api.demo.addPayment(p);
      setPayments(freshPayments);
      // Calculate new status based on ALL payments for this invoice (including new one)
      const totalPaid = freshPayments.filter(pm => pm.invoiceId === invoiceId).reduce((s, pm) => s + pm.amount, 0);
      const inv = invoices.find(i => i.id === invoiceId);
      if (inv) {
        const newStatus: Invoice['status'] = totalPaid >= inv.final ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';
        setInvoices(api.demo.updateInvoiceStatus(invoiceId, newStatus));
      }
      toast('✅ Payment recorded');
    }
  }, [patients, perms, invoices]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!currentUser) return <AuthOverlay onLogin={handleLogin} />;

  const userInitial = getInitials(currentUser.name);
  const modeBadge = modeRef.current === 'demo';
  const roleLabel = currentUser.role === 'receptionist' ? '👤 Receptionist' : currentUser.role === 'doctor' ? '🩺 Doctor' : '🦷 Patient';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard patients={filteredPatients} doctors={filteredDoctors} appointments={filteredAppointments} invoices={filteredInvoices} payments={filteredPayments} treatments={treatments} visits={filteredVisits} userName={getDisplayName(currentUser.name)} onNavigate={handleNavigate} perms={perms} userRole={currentUser.role} />;
      case 'patients':
        return <Patients patients={filteredPatients} doctors={doctors} onAdd={addPatient} onUpdate={updatePatient} onDelete={deletePatient} searchQuery={searchQuery} perms={perms} />;
      case 'doctors':
        return <Doctors doctors={filteredDoctors} onAdd={addDoctor} onUpdate={updateDoctor} onDelete={deleteDoctor} searchQuery={searchQuery} perms={perms} />;
      case 'appointments':
        return <Appointments appointments={filteredAppointments} patients={perms.appointments.add ? (perms.appointments.viewAll ? patients : filteredPatients) : filteredPatients} doctors={doctors} onAdd={addAppointment} onDelete={deleteAppointment} onUpdateStatus={updateAppointmentStatus} searchQuery={searchQuery} perms={perms} currentDoctorId={myDoctorId} currentPatientId={myPatientId} currentPatientName={currentPatientRecord ? `${currentPatientRecord.firstName} ${currentPatientRecord.lastName}` : getDisplayName(currentUser.name)} />;
      case 'treatments':
        return <Treatments treatments={treatments} onAdd={addTreatment} onUpdate={updateTreatment} onDelete={deleteTreatment} searchQuery={searchQuery} perms={perms} />;
      case 'visits':
        return <Visits visits={filteredVisits} patients={perms.visits.add ? (perms.visits.viewAll ? patients : filteredPatients) : filteredPatients} doctors={doctors} treatments={treatments} onAdd={addVisit} onDelete={deleteVisit} onUpdateStatus={updateVisitStatus} searchQuery={searchQuery} perms={perms} currentDoctorId={myDoctorId} />;
      case 'payments':
        return <Payments invoices={filteredInvoices} payments={filteredPayments} onAddPayment={addPayment} searchQuery={searchQuery} perms={perms} currentPatientId={myPatientId} currentPatientName={currentPatientRecord ? `${currentPatientRecord.firstName} ${currentPatientRecord.lastName}` : undefined} />;
      case 'profile':
        return <Profile user={currentUser} patients={filteredPatients} doctors={filteredDoctors} appointments={filteredAppointments} visits={filteredVisits} treatments={treatments} payments={filteredPayments} onNavigate={handleNavigate} />;
      default: return null;
    }
  };

  return (
    <>
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} user={currentUser} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} perms={perms} />
      <div className="main-wrapper">
        <Header onOpenSidebar={() => setSidebarOpen(true)} darkMode={darkMode} onToggleTheme={() => setDarkMode(d => !d)} userInitial={userInitial} onNavigate={handleNavigate} searchQuery={searchQuery} onSearch={setSearchQuery} />

        {/* Role + mode banners */}
        

        {loading && <div style={{ height: 3, background: 'var(--primary)', animation: 'loadingBar 1.5s ease infinite', position: 'relative', zIndex: 50 }} />}
        <main className="main-content">{renderPage()}</main>
        {toastMsg && (
          <div onClick={() => setToastMsg(null)} style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '.85rem 1.25rem', borderRadius: '.75rem', background: toastMsg.startsWith('❌') ? '#fee2e2' : toastMsg.startsWith('⚠️') || toastMsg.startsWith('🔒') ? '#fef3c7' : '#d1fae5', color: toastMsg.startsWith('❌') ? '#991b1b' : toastMsg.startsWith('⚠️') || toastMsg.startsWith('🔒') ? '#92400e' : '#065f46', fontWeight: 600, fontSize: '.85rem', boxShadow: '0 10px 25px rgba(0,0,0,.15)', cursor: 'pointer', animation: 'slideUp .3s ease', maxWidth: 380 }}>
            {toastMsg}
          </div>
        )}
        <footer className="footer">
          <div className="footer-content"><div className="footer-brand"><span className="footer-logo">🦷 Dental Clinic</span><p>Professional dental clinic management system</p></div><div className="footer-links"><a href="#">Help Center</a><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div></div>
          <div className="footer-bottom"><span>© 2026 Dental Clinic Management System{modeRef.current === 'live' ? '' : ' '}</span></div>
        </footer>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes loadingBar{0%{width:0;left:0}50%{width:60%}100%{width:0;left:100%}}`}</style>
    </>
  );
}
