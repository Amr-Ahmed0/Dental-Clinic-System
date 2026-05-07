import { Users, Stethoscope, Calendar, DollarSign, Heart, FileText, Pill, ClipboardList, TrendingUp, Clock } from 'lucide-react';
import { Patient, Doctor, Appointment, Invoice, Payment, Treatment, Visit, Page } from '../types';
import { getFirstName } from '../displayName';

interface Props {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  invoices: Invoice[];
  payments: Payment[];
  treatments: Treatment[];
  visits: Visit[];
  userName: string;
  onNavigate: (page: Page) => void;
}

function getStatusBadgeClass(status: string) {
  const s = status.toLowerCase().replace('-', '').replace(' ', '');
  if (s === 'confirmed') return 'badge badge-confirmed';
  if (s === 'scheduled') return 'badge badge-scheduled';
  if (s === 'completed') return 'badge badge-completed';
  if (s === 'cancelled') return 'badge badge-cancelled';
  if (s === 'noshow') return 'badge badge-no-show';
  return 'badge badge-scheduled';
}

// Mini bar chart component
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: `${Math.max((v / max) * 100, 8)}%`,
            background: color,
            borderRadius: 2,
            opacity: i === data.length - 1 ? 1 : 0.5 + (i / data.length) * 0.5,
            transition: 'height .3s ease',
          }}
        />
      ))}
    </div>
  );
}

export default function Dashboard({ patients, doctors, appointments, invoices, payments, treatments, visits, userName, onNavigate }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today);
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalVisits = visits.length;
  const completedAppts = appointments.filter(a => a.status === 'Completed').length;
  const pendingAppts = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length;
  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid').length;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Generate last 7 days appointment counts for mini chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0];
    return appointments.filter(a => a.date === d).length;
  });

  const last7Revenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0];
    return payments.filter(p => p.date === d).reduce((s, p) => s + p.amount, 0);
  });

  // Recent appointments (last 5 that aren't today)
  const upcomingAppts = appointments
    .filter(a => a.date >= today && (a.status === 'Scheduled' || a.status === 'Confirmed'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  return (
    <div className="page-animate">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome back, {getFirstName(userName)}! 👋</h2>
          <p>Here's what's happening at your clinic today</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="welcome-date">
            <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            {currentDate}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="section-header">
        <h3 className="section-title">Overview</h3>
        <span style={{ fontSize: '.8rem', color: 'var(--gray-400)' }}>Real-time statistics</span>
      </div>

      <div className="cards">
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('patients')}>
          <div className="card-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div className="card-body" style={{ flex: 1 }}>
            <span className="card-title">Total Patients</span>
            <span className="card-value">{patients.length}</span>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('doctors')}>
          <div className="card-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <Stethoscope size={24} />
          </div>
          <div className="card-body" style={{ flex: 1 }}>
            <span className="card-title">Doctors</span>
            <span className="card-value">{doctors.length}</span>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('appointments')}>
          <div className="card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="card-body" style={{ flex: 1 }}>
            <span className="card-title">Appointments</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem' }}>
              <span className="card-value">{appointments.length}</span>
              <span style={{ fontSize: '.7rem', color: 'var(--success)' }}>({todayAppts.length} today)</span>
            </div>
          </div>
          <MiniBarChart data={last7} color="#f59e0b" />
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('payments')}>
          <div className="card-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <DollarSign size={24} />
          </div>
          <div className="card-body" style={{ flex: 1 }}>
            <span className="card-title">Total Revenue</span>
            <span className="card-value">${totalRevenue.toLocaleString()}</span>
          </div>
          <MiniBarChart data={last7Revenue} color="#ef4444" />
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('visits')}>
          <div className="card-icon" style={{ background: '#cffafe', color: '#06b6d4' }}>
            <Heart size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Visits</span>
            <span className="card-value">{totalVisits}</span>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('treatments')}>
          <div className="card-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
            <Pill size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Treatments</span>
            <span className="card-value">{treatments.length}</span>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '.75rem 1rem' }}>
          <TrendingUp size={18} style={{ color: 'var(--success)' }} />
          <div className="card-body" style={{ gap: 0 }}>
            <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Completed</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>{completedAppts}</span>
          </div>
        </div>
        <div className="card" style={{ padding: '.75rem 1rem' }}>
          <Clock size={18} style={{ color: 'var(--warning)' }} />
          <div className="card-body" style={{ gap: 0 }}>
            <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Pending</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>{pendingAppts}</span>
          </div>
        </div>
        <div className="card" style={{ padding: '.75rem 1rem' }}>
          <FileText size={18} style={{ color: 'var(--danger)' }} />
          <div className="card-body" style={{ gap: 0 }}>
            <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Unpaid</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: unpaidInvoices > 0 ? 'var(--danger)' : 'var(--gray-900)' }}>{unpaidInvoices}</span>
          </div>
        </div>
        <div className="card" style={{ padding: '.75rem 1rem' }}>
          <ClipboardList size={18} style={{ color: '#8b5cf6' }} />
          <div className="card-body" style={{ gap: 0 }}>
            <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Invoices</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>{invoices.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => onNavigate('patients')}>
            <div className="action-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Users size={20} />
            </div>
            <span>New Patient</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('appointments')}>
            <div className="action-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <Calendar size={20} />
            </div>
            <span>New Appointment</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('visits')}>
            <div className="action-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <ClipboardList size={20} />
            </div>
            <span>Record Visit</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('treatments')}>
            <div className="action-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
              <Pill size={20} />
            </div>
            <span>Add Treatment</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('payments')}>
            <div className="action-icon" style={{ background: '#cffafe', color: '#06b6d4' }}>
              <DollarSign size={20} />
            </div>
            <span>New Payment</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('doctors')}>
            <div className="action-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
              <Stethoscope size={20} />
            </div>
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      {/* Two-column layout for panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Today's Appointments */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Calendar size={18} />
              Today's Appointments
            </h3>
            <span className="badge badge-scheduled">{todayAppts.length} scheduled</span>
          </div>
          <div className="panel-body">
            {todayAppts.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '1.5rem' }}>
                No appointments scheduled for today ✨
              </p>
            ) : (
              todayAppts.map(appt => (
                <div key={appt.id} className="appt-item">
                  <div className="appt-info">
                    <div className="appt-avatar">{appt.patientName.charAt(0)}</div>
                    <div className="appt-details">
                      <span className="appt-name">{appt.patientName}</span>
                      <span className="appt-doctor">{appt.doctorName} • {appt.reason}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span className={getStatusBadgeClass(appt.status)}>{appt.status}</span>
                    <span className="appt-time">{appt.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Clock size={18} />
              Upcoming Schedule
            </h3>
            <button
              onClick={() => onNavigate('appointments')}
              style={{ fontSize: '.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
            >
              View All →
            </button>
          </div>
          <div className="panel-body">
            {upcomingAppts.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '1.5rem' }}>
                No upcoming appointments
              </p>
            ) : (
              upcomingAppts.map(appt => (
                <div key={appt.id} className="appt-item">
                  <div className="appt-info">
                    <div className="appt-avatar" style={{
                      background: appt.date === today ? '#dbeafe' : '#f3f4f6',
                      color: appt.date === today ? '#2563eb' : '#6b7280'
                    }}>
                      {appt.patientName.charAt(0)}
                    </div>
                    <div className="appt-details">
                      <span className="appt-name">{appt.patientName}</span>
                      <span className="appt-doctor">{appt.doctorName}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="appt-time">{appt.time}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--gray-400)' }}>
                      {appt.date === today ? 'Today' : new Date(appt.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="panel" style={{ marginTop: '.5rem' }}>
        <div className="panel-header">
          <h3 className="panel-title">
            <ClipboardList size={18} />
            Recent Visits
          </h3>
          <button
            onClick={() => onNavigate('visits')}
            style={{ fontSize: '.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
          >
            View All →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>Patient</th>
                <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>Doctor</th>
                <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>Date</th>
                <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visits.slice(-4).reverse().map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '.6rem 1rem', fontSize: '.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>{v.patientName}</td>
                  <td style={{ padding: '.6rem 1rem', fontSize: '.85rem', color: 'var(--gray-600)' }}>{v.doctorName}</td>
                  <td style={{ padding: '.6rem 1rem', fontSize: '.85rem', color: 'var(--gray-600)' }}>{v.date}</td>
                  <td style={{ padding: '.6rem 1rem' }}>
                    <span className={`badge ${v.status === 'Completed' ? 'badge-completed' : v.status === 'Follow-Up Required' ? 'badge-partial' : 'badge-scheduled'}`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
