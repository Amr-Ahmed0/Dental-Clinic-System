import React, { useState } from 'react';
import { Appointment, Patient, Doctor } from '../types';
import { Trash2, X, Calendar } from 'lucide-react';

interface Props {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onAdd: (a: Appointment) => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: Appointment['status']) => void;
  searchQuery: string;
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

export default function Appointments({ appointments, patients, doctors, onAdd, onDelete, onUpdateStatus, searchQuery }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('Scheduled');
  const [reason, setReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || `${a.patientName} ${a.doctorName} ${a.reason}`.toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));

  const resetForm = () => {
    setPatientId(''); setDoctorId(''); setDate(''); setTime(''); setStatus('Scheduled'); setReason('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === Number(patientId));
    const doctor = doctors.find(d => d.id === Number(doctorId));
    if (!patient || !doctor) return;

    const newAppt: Appointment = {
      id: Date.now(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date, time, status, reason,
    };
    onAdd(newAppt);
    resetForm();
    setShowForm(false);
  };

  const todayCount = appointments.filter(a => a.date === today).length;
  const upcomingCount = appointments.filter(a => a.date >= today && (a.status === 'Scheduled' || a.status === 'Confirmed')).length;

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>Appointments</h2>
        <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? <span><X size={16} style={{ verticalAlign: 'middle' }} /> Close</span> : '+ New Appointment'}
        </button>
      </div>

      {/* Summary */}
      <div className="cards" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Total</span>
            <span className="card-value">{appointments.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <span className="card-title">Today</span>
            <span className="card-value" style={{ color: 'var(--primary)' }}>{todayCount}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <span className="card-title">Upcoming</span>
            <span className="card-value" style={{ color: 'var(--success)' }}>{upcomingCount}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <span className="card-title">Completed</span>
            <span className="card-value">{appointments.filter(a => a.status === 'Completed').length}</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">Book New Appointment</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Patient *</label>
                <select required={true} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Doctor *</label>
                <select required value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Date *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Time *</label>
                <input type="text" placeholder="e.g. 09:00 AM" required value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as Appointment['status'])}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-Show">No-Show</option>
                </select>
              </div>
              <div className="form-field full-width">
                <label>Reason for Visit</label>
                <textarea placeholder="Reason for visit..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="submit-btn">Book Appointment</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {['', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'].map(s => (
          <button
            key={s}
            className="tbl-btn"
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            style={filterStatus === s ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Reason</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No appointments found</td></tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id} style={a.date === today ? { background: 'rgba(37,99,235,.04)' } : undefined}>
                  <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>#{a.id}</td>
                  <td style={{ fontWeight: 600 }}>{a.patientName}</td>
                  <td>{a.doctorName}</td>
                  <td>
                    <span style={{ fontWeight: a.date === today ? 700 : 400, color: a.date === today ? 'var(--primary)' : undefined }}>
                      {a.date === today ? 'Today' : a.date}
                    </span>
                  </td>
                  <td>{a.time}</td>
                  <td>
                    <select
                      className={getStatusBadgeClass(a.status)}
                      value={a.status}
                      onChange={e => onUpdateStatus(a.id, e.target.value as Appointment['status'])}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.75rem', padding: '.2rem .4rem', borderRadius: '9999px', fontFamily: 'inherit' }}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="No-Show">No-Show</option>
                    </select>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.reason || '—'}</td>
                  <td>
                    <button className="tbl-btn danger" onClick={() => onDelete(a.id)} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
