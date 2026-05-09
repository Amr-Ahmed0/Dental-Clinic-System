import { useState } from 'react';
import { Doctor } from '../types';
import { Edit2, Trash2, X, Stethoscope } from 'lucide-react';
import { Permissions } from '../permissions';

interface Props {
  doctors: Doctor[];
  onAdd: (d: Doctor) => void;
  onUpdate: (d: Doctor) => void;
  onDelete: (id: number) => void;
  searchQuery: string;
  perms: Permissions;
}

export default function Doctors({ doctors, onAdd, onUpdate, onDelete, searchQuery, perms }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState('');

  const filtered = doctors.filter(d => {
    const q = searchQuery.toLowerCase();
    return !q || `${d.name} ${d.specialty} ${d.email}`.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setName(''); setSpecialty(''); setPhone(''); setEmail(''); setHours(''); setEditId(null);
  };

  const openEdit = (d: Doctor) => {
    setEditId(d.id);
    setName(d.name); setSpecialty(d.specialty); setPhone(d.phone);
    setEmail(d.email); setHours(d.workingHours);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Doctor = { id: editId || Date.now(), name, specialty, phone, email, workingHours: hours };
    if (editId) { onUpdate(data); } else { onAdd(data); }
    resetForm();
    setShowForm(false);
  };

  const specialtyColors: Record<string, { bg: string; color: string }> = {
    'General Dentistry': { bg: '#dbeafe', color: '#2563eb' },
    'Orthodontics': { bg: '#d1fae5', color: '#10b981' },
    'Periodontics': { bg: '#fef3c7', color: '#f59e0b' },
    'Endodontics': { bg: '#fee2e2', color: '#ef4444' },
    'Pediatric Dentistry': { bg: '#ede9fe', color: '#8b5cf6' },
    'Oral Surgery': { bg: '#cffafe', color: '#06b6d4' },
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>Doctors</h2>
        {perms.doctors.add && (
          <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            {showForm ? <><X size={16} style={{ verticalAlign: 'middle' }} /> Close</> : '+ Add Doctor'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">{editId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Name *</label>
                <input type="text" placeholder="Doctor name" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Specialty</label>
                <input type="text" placeholder="e.g. General Dentistry" value={specialty} onChange={e => setSpecialty(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Working Hours</label>
                <input type="text" placeholder="e.g. Mon-Fri 09:00-17:00" value={hours} onChange={e => setHours(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="submit-btn">{editId ? 'Update Doctor' : 'Add Doctor'}</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Doctor cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1/-1' }}>
            <div className="panel-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              <Stethoscope size={40} style={{ marginBottom: '.75rem', opacity: .4 }} />
              <p>No doctors found</p>
            </div>
          </div>
        ) : (
          filtered.map(d => {
            const sc = specialtyColors[d.specialty] || { bg: '#f3f4f6', color: '#6b7280' };
            return (
              <div key={d.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, overflow: 'hidden' }}>
                <div style={{ background: sc.bg, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: sc.color,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1.1rem',
                    }}>
                      {d.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#1e293b' }}>{d.name}</div>
                      <span style={{
                        fontSize: '.75rem', fontWeight: 600, color: sc.color,
                        background: 'rgba(255,255,255,.7)', padding: '.1rem .5rem', borderRadius: '9999px',
                      }}>
                        {d.specialty || 'General'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.25rem' }}>
                    {perms.doctors.edit && (
                      <button className="tbl-btn" onClick={() => openEdit(d)} title="Edit" style={{ background: 'rgba(255,255,255,.7)' }}>
                        <Edit2 size={13} />
                      </button>
                    )}
                    {perms.doctors.delete && (
                      <button className="tbl-btn danger" onClick={() => onDelete(d.id)} title="Delete" style={{ background: 'rgba(255,255,255,.7)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '.75rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Phone</span>
                    <span style={{ fontSize: '.85rem', color: 'var(--gray-800)', fontWeight: 500 }}>{d.phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '.75rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Email</span>
                    <span style={{ fontSize: '.85rem', color: 'var(--gray-800)', fontWeight: 500 }}>{d.email || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '.75rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Hours</span>
                    <span style={{ fontSize: '.85rem', color: 'var(--gray-800)', fontWeight: 500 }}>{d.workingHours || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
