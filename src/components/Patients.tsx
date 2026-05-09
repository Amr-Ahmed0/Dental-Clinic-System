import { useState } from 'react';
import { Patient, Doctor } from '../types';
import { Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { Permissions } from '../permissions';

interface Props {
  patients: Patient[];
  doctors: Doctor[];
  onAdd: (p: Patient) => void;
  onUpdate: (p: Patient) => void;
  onDelete: (id: number) => void;
  searchQuery: string;
  perms: Permissions;
}

export default function Patients({ patients, doctors, onAdd, onUpdate, onDelete, searchQuery, perms }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);

  const filtered = patients.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || `${p.firstName} ${p.lastName} ${p.phone} ${p.email} ${p.assignedDoctor}`.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setFirstName(''); setLastName(''); setGender(''); setDob('');
    setPhone(''); setEmail(''); setAddress(''); setMedicalHistory('');
    setAssignedDoctor(''); setEditId(null);
  };

  const openEdit = (p: Patient) => {
    setEditId(p.id);
    setFirstName(p.firstName); setLastName(p.lastName); setGender(p.gender);
    setDob(p.dob); setPhone(p.phone); setEmail(p.email); setAddress(p.address);
    setMedicalHistory(p.medicalHistory); setAssignedDoctor(p.assignedDoctor);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Patient = {
      id: editId || Date.now(),
      firstName, lastName, gender, dob, phone, email, address, medicalHistory, assignedDoctor,
    };
    if (editId) { onUpdate(data); } else { onAdd(data); }
    resetForm();
    setShowForm(false);
  };

  const viewPatient = viewId !== null ? patients.find(p => p.id === viewId) : null;

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>Patients</h2>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <span style={{ fontSize: '.85rem', color: 'var(--gray-400)', alignSelf: 'center' }}>
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
          </span>
          {perms.patients.add && (
            <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
              {showForm ? <><X size={16} style={{ verticalAlign: 'middle' }} /> Close</> : '+ Add Patient'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">{editId ? 'Edit Patient' : 'Add New Patient'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>First Name *</label>
                <input type="text" placeholder="Enter first name" required value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Last Name *</label>
                <input type="text" placeholder="Enter last name" required value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input type="tel" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Assigned Doctor</label>
                <select value={assignedDoctor} onChange={e => setAssignedDoctor(e.target.value)}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-field full-width">
                <label>Address</label>
                <textarea placeholder="Enter address" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Medical History</label>
                <textarea placeholder="Medical notes..." value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="submit-btn">{editId ? 'Update Patient' : 'Add Patient'}</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Patient detail modal */}
      {viewPatient && (
        <div className="form-container" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="form-title" style={{ marginBottom: 0 }}>Patient Details</h3>
            <button className="tbl-btn" onClick={() => setViewId(null)}><X size={14} /> Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Full Name</p>
              <p style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{viewPatient.firstName} {viewPatient.lastName}</p>
            </div>
            <div>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Gender</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.gender || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Date of Birth</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.dob || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Phone</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.phone || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Email</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.email || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Doctor</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.assignedDoctor || '—'}</p>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Address</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.address || '—'}</p>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '.15rem' }}>Medical History</p>
              <p style={{ color: 'var(--gray-800)' }}>{viewPatient.medicalHistory || '—'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Gender</th><th>Phone</th><th>Email</th><th>Assigned Doctor</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No patients found</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>#{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.75rem', flexShrink: 0,
                      }}>
                        {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td>{p.gender || '—'}</td>
                  <td>{p.phone || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.assignedDoctor || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.25rem' }}>
                      <button className="tbl-btn" onClick={() => setViewId(viewId === p.id ? null : p.id)} title="View">
                        {viewId === p.id ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      {perms.patients.edit && (
                        <button className="tbl-btn" onClick={() => openEdit(p)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                      )}
                      {perms.patients.delete && (
                        <button className="tbl-btn danger" onClick={() => onDelete(p.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
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
