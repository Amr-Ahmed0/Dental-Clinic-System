import { useState } from 'react';
import { Visit, Patient, Doctor, Treatment } from '../types';
import { ClipboardList, ChevronDown, ChevronUp, Pill, X } from 'lucide-react';

interface Props {
  visits: Visit[];
  patients: Patient[];
  doctors: Doctor[];
  treatments: Treatment[];
  onAdd: (v: Visit) => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: Visit['status']) => void;
  searchQuery: string;
}

function getVisitBadgeClass(status: string) {
  if (status === 'Completed') return 'badge badge-completed';
  if (status === 'In Progress') return 'badge badge-scheduled';
  if (status === 'Follow-Up Required') return 'badge badge-partial';
  return 'badge badge-scheduled';
}

export default function Visits({ visits, patients, doctors, treatments, onAdd, onDelete, onUpdateStatus, searchQuery }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState<number[]>([]);
  const [status, setStatus] = useState<Visit['status']>('In Progress');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = visits.filter(v => {
    const q = searchQuery.toLowerCase();
    return !q || `${v.patientName} ${v.doctorName} ${v.diagnosis}`.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setPatientId(''); setDoctorId(''); setDate(''); setDiagnosis('');
    setNotes(''); setSelectedTreatments([]); setStatus('In Progress');
  };

  const toggleTreatment = (id: number) => {
    setSelectedTreatments(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === Number(patientId));
    const doctor = doctors.find(d => d.id === Number(doctorId));
    if (!patient || !doctor) return;

    const newVisit: Visit = {
      id: Date.now(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date, diagnosis, notes,
      treatmentIds: selectedTreatments,
      status,
    };
    onAdd(newVisit);
    resetForm();
    setShowForm(false);
  };

  const getTreatmentCost = (ids: number[]) => {
    return ids.reduce((sum, id) => {
      const t = treatments.find(tr => tr.id === id);
      return sum + (t?.cost || 0);
    }, 0);
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>Visits</h2>
        <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? <><X size={16} style={{ verticalAlign: 'middle' }} /> Close</> : '+ Record Visit'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="cards" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-icon" style={{ background: '#cffafe', color: '#06b6d4' }}>
            <ClipboardList size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Total Visits</span>
            <span className="card-value">{visits.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <span className="card-title">Completed</span>
            <span className="card-value" style={{ color: 'var(--success)' }}>{visits.filter(v => v.status === 'Completed').length}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <span className="card-title">Follow-Up Required</span>
            <span className="card-value" style={{ color: 'var(--warning)' }}>{visits.filter(v => v.status === 'Follow-Up Required').length}</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">Record New Visit</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Patient *</label>
                <select required value={patientId} onChange={e => setPatientId(e.target.value)}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Doctor *</label>
                <select required value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Date *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as Visit['status'])}>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Follow-Up Required">Follow-Up Required</option>
                </select>
              </div>
              <div className="form-field full-width">
                <label>Diagnosis *</label>
                <textarea placeholder="Patient diagnosis..." required value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Clinical Notes</label>
                <textarea placeholder="Additional clinical notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Treatments Performed</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', padding: '.5rem', background: 'var(--bg-main)', borderRadius: '.5rem', border: '1.5px solid var(--border-color)' }}>
                  {treatments.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTreatment(t.id)}
                      style={{
                        padding: '.35rem .75rem',
                        borderRadius: '9999px',
                        fontSize: '.8rem',
                        fontWeight: 600,
                        border: `1.5px solid ${selectedTreatments.includes(t.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: selectedTreatments.includes(t.id) ? 'var(--primary)' : 'var(--bg-card)',
                        color: selectedTreatments.includes(t.id) ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all .2s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t.name} (${t.cost})
                    </button>
                  ))}
                </div>
                {selectedTreatments.length > 0 && (
                  <p style={{ fontSize: '.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '.35rem' }}>
                    Total: ${getTreatmentCost(selectedTreatments).toFixed(2)} — {selectedTreatments.length} treatment{selectedTreatments.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="submit-btn">Record Visit</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Visits list as expandable cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {filtered.length === 0 ? (
          <div className="panel">
            <div className="panel-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              <ClipboardList size={40} style={{ marginBottom: '.75rem', opacity: .4 }} />
              <p>No visits found</p>
            </div>
          </div>
        ) : (
          filtered.sort((a, b) => b.date.localeCompare(a.date)).map(v => {
            const isExpanded = expandedId === v.id;
            const visitTreatments = v.treatmentIds.map(id => treatments.find(t => t.id === id)).filter(Boolean) as Treatment[];

            return (
              <div key={v.id} className="panel" style={{ overflow: 'visible' }}>
                <div
                  className="panel-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', background: '#cffafe', color: '#06b6d4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', flexShrink: 0,
                    }}>
                      {v.patientName.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--gray-900)' }}>{v.patientName}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--gray-500)' }}>{v.doctorName} • {v.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span className={getVisitBadgeClass(v.status)}>{v.status}</span>
                    <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ${getTreatmentCost(v.treatmentIds).toFixed(2)}
                    </span>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--gray-400)' }} /> : <ChevronDown size={18} style={{ color: 'var(--gray-400)' }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="panel-body" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' }}>Diagnosis</p>
                        <p style={{ color: 'var(--gray-800)', fontSize: '.9rem' }}>{v.diagnosis}</p>
                      </div>
                      {v.notes && (
                        <div>
                          <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' }}>Clinical Notes</p>
                          <p style={{ color: 'var(--gray-800)', fontSize: '.9rem' }}>{v.notes}</p>
                        </div>
                      )}
                    </div>

                    {visitTreatments.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Treatments Performed</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                          {visitTreatments.map(t => (
                            <div key={t.id} style={{
                              display: 'flex', alignItems: 'center', gap: '.5rem',
                              padding: '.4rem .75rem', background: '#ede9fe', borderRadius: '.5rem',
                            }}>
                              <Pill size={14} style={{ color: '#8b5cf6' }} />
                              <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#6d28d9' }}>{t.name}</span>
                              <span style={{ fontSize: '.75rem', color: '#7c3aed' }}>${t.cost}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={v.status}
                        onChange={e => onUpdateStatus(v.id, e.target.value as Visit['status'])}
                        style={{
                          padding: '.3rem .6rem', borderRadius: '.375rem', fontSize: '.8rem',
                          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                          color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Follow-Up Required">Follow-Up Required</option>
                      </select>
                      <button className="tbl-btn danger" onClick={() => onDelete(v.id)}>Delete Visit</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
