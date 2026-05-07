import { useState } from 'react';
import { Invoice, Payment } from '../types';
import { DollarSign, TrendingUp, AlertCircle, X } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  payments: Payment[];
  onAddPayment: (p: Payment) => void;
  onUpdateInvoiceStatus: (id: number) => void;
  searchQuery: string;
}

function getInvoiceBadgeClass(status: string) {
  if (status === 'Paid') return 'badge badge-paid';
  if (status === 'Unpaid') return 'badge badge-unpaid';
  if (status === 'Partial') return 'badge badge-partial';
  return 'badge';
}

export default function Payments({ invoices, payments, onAddPayment, onUpdateInvoiceStatus, searchQuery }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const unpaidCount = invoices.filter(i => i.status === 'Unpaid').length;
  const unpaidTotal = invoices.filter(i => i.status === 'Unpaid').reduce((s, i) => s + i.final, 0);
  const paidCount = invoices.filter(i => i.status === 'Paid').length;

  const filteredInvoices = invoices.filter(i => {
    const q = searchQuery.toLowerCase();
    return !q || i.patientName.toLowerCase().includes(q);
  });

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.patientName.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setInvoiceId(''); setAmount(''); setMethod(''); setDate(''); setNotes(''); setMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = invoices.find(i => i.id === Number(invoiceId));
    if (!invoice) { setMsg('Please select an invoice'); return; }

    const newPayment: Payment = {
      id: Date.now(),
      invoiceId: invoice.id,
      patientName: invoice.patientName,
      amount: parseFloat(amount),
      method, date, notes,
    };
    onAddPayment(newPayment);
    // Delay to ensure state updates
    setTimeout(() => onUpdateInvoiceStatus(invoice.id), 100);
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>Payments & Invoices</h2>
        <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? <><X size={16} style={{ verticalAlign: 'middle' }} /> Close</> : '+ Add Payment'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="cards">
        <div className="card">
          <div className="card-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Total Revenue</span>
            <span className="card-value" style={{ color: 'var(--success)' }}>${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <DollarSign size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Payments Made</span>
            <span className="card-value">{payments.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Unpaid ({unpaidCount})</span>
            <span className="card-value" style={{ color: unpaidCount > 0 ? 'var(--danger)' : undefined }}>${unpaidTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <span className="card-title">Paid Invoices</span>
            <span className="card-value" style={{ color: 'var(--success)' }}>{paidCount}</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3 className="form-title">Record New Payment</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Invoice <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select required value={invoiceId} onChange={e => setInvoiceId(e.target.value)}>
                  <option value="">Select invoice / patient</option>
                  {invoices.filter(i => i.status !== 'Paid').map(i => (
                    <option key={i.id} value={i.id}>#{i.id} — {i.patientName} (${i.final} — {i.status})</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Amount ($) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="number" step="0.01" min="0.01" placeholder="0.00" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Method <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select required value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit Card</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Online">Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-field">
                <label>Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Notes (optional)</label>
                <textarea placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="submit-btn">Record Payment</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
            {msg && <p style={{ marginTop: '.5rem', color: 'var(--danger)', fontSize: '.875rem' }}>{msg}</p>}
          </form>
        </div>
      )}

      {/* Invoices */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Invoices</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Patient</th><th>Total</th><th>Discount</th><th>Final</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No invoices found</td></tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>#{inv.id}</td>
                    <td style={{ fontWeight: 600 }}>{inv.patientName}</td>
                    <td>${inv.total.toFixed(2)}</td>
                    <td style={{ color: inv.discount > 0 ? 'var(--success)' : undefined }}>
                      {inv.discount > 0 ? `-$${inv.discount.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>${inv.final.toFixed(2)}</td>
                    <td><span className={getInvoiceBadgeClass(inv.status)}>{inv.status}</span></td>
                    <td style={{ fontSize: '.85rem', color: 'var(--gray-500)' }}>{inv.createdAt}</td>
                    <td>
                      {inv.status !== 'Paid' && (
                        <button className="tbl-btn" onClick={() => { setInvoiceId(String(inv.id)); setShowForm(true); }}>
                          💳 Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Payment History</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Patient</th><th>Amount</th><th>Method</th><th>Date</th><th>Invoice</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No payments found</td></tr>
              ) : (
                [...filteredPayments].reverse().map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.patientName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${p.amount.toFixed(2)}</td>
                    <td>
                      <span className="badge badge-scheduled">{p.method}</span>
                    </td>
                    <td>{p.date}</td>
                    <td style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>#{p.invoiceId}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
