import { User, Patient, Doctor, Appointment, Visit, Treatment, Payment } from '../types';
import { Page } from '../types';
import { Mail, Phone, Calendar, Shield, Clock } from 'lucide-react';
import { getDisplayName, getInitials } from '../utils/displayName';

interface Props {
  user: User;
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  visits: Visit[];
  treatments: Treatment[];
  payments: Payment[];
  onNavigate: (page: Page) => void;
}

export default function Profile({ user, patients, doctors, appointments, visits, treatments, payments, onNavigate }: Props) {
  const initial = getInitials(user.name);
  const displayName = getDisplayName(user.name);
  const roleColor = user.role === 'doctor' ? '#10b981' : user.role === 'patient' ? '#2563eb' : '#f59e0b';

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>My Profile</h2>
        <button className="add-btn" style={{ background: 'var(--gray-500)' }} onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 900 }}>
        {/* Profile Card */}
        <div className="panel" style={{ overflow: 'visible' }}>
          <div style={{
            background: `linear-gradient(135deg, ${roleColor}22 0%, ${roleColor}11 100%)`,
            padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '2.25rem', flexShrink: 0,
                boxShadow: `0 4px 14px ${roleColor}44`,
              }}>
                {initial}
              </div>
              <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '.25rem' }}>{displayName}</h3>
                <span style={{
                  display: 'inline-block', padding: '.3rem .9rem', borderRadius: '9999px',
                  fontSize: '.8rem', fontWeight: 600, background: `${roleColor}22`, color: roleColor,
                  textTransform: 'capitalize', border: `1.5px solid ${roleColor}44`,
                }}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '.5rem', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} style={{ color: 'var(--gray-500)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Email</p>
                  <p style={{ color: 'var(--gray-800)', fontWeight: 500, fontSize: '.9rem' }}>{user.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '.5rem', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={16} style={{ color: 'var(--gray-500)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Phone</p>
                  <p style={{ color: 'var(--gray-800)', fontWeight: 500, fontSize: '.9rem' }}>{user.phone || '—'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '.5rem', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} style={{ color: 'var(--gray-500)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Role</p>
                  <p style={{ color: 'var(--gray-800)', fontWeight: 500, fontSize: '.9rem', textTransform: 'capitalize' }}>{user.role}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '.5rem', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} style={{ color: 'var(--gray-500)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Member Since</p>
                  <p style={{ color: 'var(--gray-800)', fontWeight: 500, fontSize: '.9rem' }}>{user.createdAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific stats */}
        {user.role === 'receptionist' && (
          <div className="panel" style={{ overflow: 'visible' }}>
            <div className="panel-header">
              <h3 className="panel-title">Clinic Overview</h3>
            </div>
            <div className="panel-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Patients', value: patients.length, color: '#2563eb' },
                  { label: 'Doctors', value: doctors.length, color: '#10b981' },
                  { label: 'Appointments', value: appointments.length, color: '#f59e0b' },
                  { label: 'Treatments', value: treatments.length, color: '#8b5cf6' },
                  { label: 'Visits', value: visits.length, color: '#06b6d4' },
                  { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '1rem', borderRadius: '.5rem', background: `${s.color}08`,
                    border: `1px solid ${s.color}22`, textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>{s.label}</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {user.role === 'doctor' && (() => {
          const doc = doctors.find(d => d.email === user.email || d.name === user.name);
          const myAppts = appointments.filter(a => a.doctorName === user.name || (doc && a.doctorId === doc.id));
          const myVisits = visits.filter(v => v.doctorName === user.name || (doc && v.doctorId === doc.id));
          const myPatients = patients.filter(p => p.assignedDoctor === (doc?.name || user.name));
          return (
            <div className="panel" style={{ overflow: 'visible' }}>
              <div className="panel-header">
                <h3 className="panel-title">
                  <Clock size={18} />
                  Doctor Statistics
                </h3>
              </div>
              <div className="panel-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Specialty</p>
                    <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{doc?.specialty || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Working Hours</p>
                    <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{doc?.workingHours || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Appointments</p>
                    <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>{myAppts.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Patients</p>
                    <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.25rem' }}>{myPatients.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Visits</p>
                    <p style={{ fontWeight: 700, color: '#06b6d4', fontSize: '1.25rem' }}>{myVisits.length}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {user.role === 'patient' && (() => {
          const patient = patients.find(p => p.email === user.email);
          const myAppts = patient ? appointments.filter(a => a.patientId === patient.id) : [];
          const myVisits = patient ? visits.filter(v => v.patientId === patient.id) : [];
          return (
            <div className="panel" style={{ overflow: 'visible' }}>
              <div className="panel-header">
                <h3 className="panel-title">Patient Information</h3>
              </div>
              <div className="panel-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Assigned Doctor</p>
                    <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{patient?.assignedDoctor || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Appointments</p>
                    <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>{myAppts.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Visits</p>
                    <p style={{ fontWeight: 700, color: '#06b6d4', fontSize: '1.25rem' }}>{myVisits.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Upcoming</p>
                    <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.25rem' }}>
                      {myAppts.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length}
                    </p>
                  </div>
                </div>
                {patient?.medicalHistory && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '.5rem' }}>
                    <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Medical History</p>
                    <p style={{ color: 'var(--gray-800)', fontSize: '.9rem' }}>{patient.medicalHistory}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
