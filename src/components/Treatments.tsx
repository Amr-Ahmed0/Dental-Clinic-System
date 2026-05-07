import { useState } from 'react';
import { Treatment } from '../types';
import { Pill, Edit2, Trash2, Search, X } from 'lucide-react';

interface Props {
  treatments: Treatment[];
  onAdd: (t: Treatment) => void;
  onUpdate: (t: Treatment) => void;
  onDelete: (id: number) => void;
  searchQuery: string;
}

const categories = ['Preventive', 'Restorative', 'Endodontics', 'Cosmetic', 'Orthodontics', 'Periodontics', 'Oral Surgery', 'Diagnostic'];

export default function Treatments({ treatments, onAdd, onUpdate, onDelete, searchQuery }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const filtered = treatments.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(q);
    const matchCat = !filterCat || t.category === filterCat;
    return matchSearch && matchCat;
  });

  const resetForm = () => {
    setName(''); setDescription(''); setCost(''); setDuration(''); setCategory('');
    setEditId(null);
  };

  const openEdit = (t: Treatment) => {
    setEditId(t.id);
    setName(t.name);
    setDescription(t.description);
    setCost(String(t.cost));
    setDuration(t.duration);
    setCategory(t.category);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const treatmentData: Treatment = {
      id: editId || Date.now(),
      name, description,
      cost: parseFloat(cost) || 0,
      duration, category,
    };
    if (editId) {
      onUpdate(treatmentData);
    } else {
      onAdd(treatmentData);
    }
    resetForm();
    setShowForm(false);
  };

  const uniqueCategories = [...new Set(treatments.map(t => t.category).filter(Boolean))];

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>Treatments</h2>
        <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? <><X size={16} style={{ verticalAlign: 'middle' }} /> Close</> : '+ Add Treatment'}
        </button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          className={`tbl-btn ${!filterCat ? 'active-filter' : ''}`}
          onClick={() => setFilterCat('')}
          style={!filterCat ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
        >
          All ({treatments.length})
        </button>
        {uniqueCategories.map(cat => (
          <button
            key={cat}
            className={`tbl-btn ${filterCat === cat ? 'active-filter' : ''}`}
            onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
            style={filterCat === cat ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
          >
            {cat} ({treatments.filter(t => t.category === cat).length})
          </button>
        ))}
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">{editId ? 'Edit Treatment' : 'Add New Treatment'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Treatment Name *</label>
                <input type="text" placeholder="e.g. Dental Cleaning" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Cost ($) *</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" required value={cost} onChange={e => setCost(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Duration</label>
                <input type="text" placeholder="e.g. 45 min" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Description</label>
                <textarea placeholder="Treatment description..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="submit-btn">{editId ? 'Update Treatment' : 'Add Treatment'}</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Treatments grid — card layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="panel" style={{ gridColumn: '1/-1' }}>
            <div className="panel-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              <Search size={40} style={{ marginBottom: '.75rem', opacity: .4 }} />
              <p>No treatments found</p>
            </div>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div className="card-icon" style={{ background: '#ede9fe', color: '#8b5cf6', width: 40, height: 40, borderRadius: '.5rem' }}>
                    <Pill size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--gray-900)' }}>{t.name}</div>
                    {t.category && (
                      <span className="badge badge-scheduled" style={{ marginTop: '.15rem' }}>{t.category}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.25rem' }}>
                  <button className="tbl-btn" onClick={() => openEdit(t)} title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button className="tbl-btn danger" onClick={() => onDelete(t.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {t.description && (
                <p style={{ fontSize: '.8rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>{t.description}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '.75rem', marginTop: 'auto' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>${t.cost.toFixed(2)}</span>
                {t.duration && (
                  <span style={{ fontSize: '.8rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                    🕐 {t.duration}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
