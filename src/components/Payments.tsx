import { useState, useMemo, useEffect } from 'react';
import { Invoice, Payment } from '../types';
import { TrendingUp, AlertCircle, X, CreditCard } from 'lucide-react';
import { Permissions } from '../permissions';

interface Props {
  invoices: Invoice[];
  payments: Payment[];
  onAddPayment: (p: Payment, invoiceId: number) => void;
  searchQuery: string;
  perms: Permissions;
  currentPatientId?: number | null;
  currentPatientName?: string;
}

export default function Payments({ invoices, payments, onAddPayment, searchQuery, perms, currentPatientId, currentPatientName }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  const isPatientPortal = perms.payments.add && !perms.payments.viewAll;
  const patientPaymentBlocked = isPatientPortal && !currentPatientId;

  // Calculate paid totals per invoice
  const paidPerInvoice = useMemo(() => {
    const map: Record<number, number> = {};
    for (const p of payments) {
      map[p.invoiceId] = (map[p.invoiceId] || 0) + p.amount;
    }
    return map;
  }, [payments]);

  const getRemaining = (inv: Invoice) => {
    const paid = paidPerInvoice[inv.id] || 0;
    return Math.max(inv.final - paid, 0);
  };

  const getRealStatus = (inv: Invoice): 'Paid' | 'Partial' | 'Unpaid' => {
    const paid = paidPerInvoice[inv.id] || 0;
    if (paid <= 0) return 'Unpaid';
    if (paid >= inv.final) return 'Paid';
    return 'Partial';
  };

  // Stats
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = invoices.reduce((s, inv) => s + getRemaining(inv), 0);
  const unpaidCount = invoices.filter(i => getRealStatus(i) === 'Unpaid').length;
  const partialCount = invoices.filter(i => getRealStatus(i) === 'Partial').length;
  const paidCount = invoices.filter(i => getRealStatus(i) === 'Paid').length;

  const filteredInvoices = invoices.filter(i => {
    const q = searchQuery.toLowerCase();
    return !q || i.patientName.toLowerCase().includes(q);
  });

  const payableInvoices = filteredInvoices.filter(i => !isPatientPortal || !currentPatientId || i.patientId === currentPatientId);
  const unpaidPayableInvoices = payableInvoices.filter(i => getRealStatus(i) !== 'Paid');

  useEffect(() => {
    if (!isPatientPortal) return;
    if (patientPaymentBlocked) return;
    if (!invoiceId && unpaidPayableInvoices.length === 1) {
      const inv = unpaidPayableInvoices[0];
      setInvoiceId(String(inv.id));
      setAmount(getRemaining(inv).toFixed(2));
    }
  }, [isPatientPortal, patientPaymentBlocked, invoiceId, unpaidPayableInvoices]);

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.patientName.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setInvoiceId(''); setAmount(''); setMethod(''); setDate(''); setNotes(''); setMsg('');
  };

  const selectedInvoice = invoices.find(i => i.id === Number(invoiceId));
  const selectedRemaining = selectedInvoice ? getRemaining(selectedInvoice) : 0;
  const invoiceLocked = isPatientPortal && unpaidPayableInvoices.length === 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = invoices.find(i => i.id === Number(invoiceId));
    if (!invoice) { setMsg('Please select an invoice'); return; }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) { setMsg('Enter a valid amount'); return; }

    const remaining = getRemaining(invoice);
    if (payAmount > remaining) {
      setMsg(`Amount exceeds remaining balance ($${remaining.toFixed(2)})`);
      return;
    }

    const newPayment: Payment = {
      id: Date.now(),
      invoiceId: invoice.id,
      patientName: invoice.patientName,
      amount: payAmount,
      method, date, notes,
    };

    onAddPayment(newPayment, invoice.id);
    resetForm();
    setShowForm(false);
  };

  const openPayForm = (invId: number) => {
    setInvoiceId(String(invId));
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      const rem = getRemaining(inv);
      setAmount(rem.toFixed(2));
    }
    setShowForm(true);
  };

  function statusBadge(status: string) {
    if (status === 'Paid') return 'badge badge-paid';
    if (status === 'Unpaid') return 'badge badge-unpaid';
    if (status === 'Partial') return 'badge badge-partial';
    return 'badge';
  }

  return (
    <div className="page-animate">
      <div className="page-header">
        <h2>{isPatientPortal ? 'My Payments & Invoices' : 'Payments & Invoices'}</h2>
        {perms.payments.add && (
          <button className="add-btn" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            {showForm ? <><X size={16} style={{ verticalAlign: 'middle' }} /> Close</> : isPatientPortal ? '+ Pay Invoice' : '+ Add Payment'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="cards">
        <div className="card">
          <div className="card-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Total Collected</span>
            <span className="card-value" style={{ color: 'var(--success)' }}>${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Outstanding</span>
            <span className="card-value" style={{ color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
              ${totalOutstanding.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <CreditCard size={24} />
          </div>
          <div className="card-body">
            <span className="card-title">Payments</span>
            <span className="card-value">{payments.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block' }}>Paid</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>{paidCount}</span>
              </div>
              <div>
                <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block' }}>Partial</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)' }}>{partialCount}</span>
              </div>
              <div>
                <span style={{ fontSize: '.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block' }}>Unpaid</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)' }}>{unpaidCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {showForm && (
        <div className="form-container">
          <h3 className="form-title">Record New Payment</h3>
          {patientPaymentBlocked && (
            <div style={{
              marginBottom: '1rem', padding: '.85rem 1rem', borderRadius: '.5rem',
              background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '.85rem',
            }}>
              Your patient account is not linked to a patient billing record yet. Please contact reception to activate online payments for your profile.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {isPatientPortal && (
                <div className="form-field">
                  <label>Patient</label>
                  <input
                    type="text"
                    readOnly
                    value={currentPatientName || 'Patient account not linked'}
                    style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: '.7rem', color: currentPatientName ? 'var(--gray-400)' : 'var(--danger)', marginTop: '.15rem' }}>
                    {currentPatientName ? 'Auto-filled from your account — cannot be changed' : 'Reception must link your account to a patient record'}
                  </p>
                </div>
              )}
              <div className="form-field">
                <label>{isPatientPortal ? 'My Invoice' : 'Invoice'} <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select required value={invoiceId} disabled={patientPaymentBlocked || invoiceLocked} onChange={e => {
                  setInvoiceId(e.target.value);
                  const inv = invoices.find(i => i.id === Number(e.target.value));
                  if (inv) setAmount(getRemaining(inv).toFixed(2));
                  setMsg('');
                }}>
                  <option value="">{isPatientPortal ? 'Select your invoice' : 'Select invoice / patient'}</option>
                  {unpaidPayableInvoices.map(i => {
                    const rem = getRemaining(i);
                    const paid = paidPerInvoice[i.id] || 0;
                    return (
                      <option key={i.id} value={i.id}>
                        {isPatientPortal ? `Invoice on ${i.createdAt} — ` : `${i.patientName} — `}Total: ${i.final.toFixed(2)} | Paid: ${paid.toFixed(2)} | Remaining: ${rem.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
                {invoiceLocked && (
                  <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', marginTop: '.15rem' }}>
                    Your only unpaid invoice is selected automatically
                  </p>
                )}
              </div>
              <div className="form-field">
                <label>Amount ($) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="number" step="0.01" min="0.01"
                  max={selectedRemaining || undefined}
                  placeholder="0.00" required value={amount} onChange={e => { setAmount(e.target.value); setMsg(''); }} />
                {selectedInvoice && (
                  <p style={{ fontSize: '.75rem', marginTop: '.25rem', color: 'var(--gray-500)' }}>
                    Remaining: <strong style={{ color: selectedRemaining > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ${selectedRemaining.toFixed(2)}
                    </strong>
                    {' '}of ${selectedInvoice.final.toFixed(2)}
                  </p>
                )}
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
              <button type="submit" className="submit-btn" disabled={patientPaymentBlocked} style={patientPaymentBlocked ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>Record Payment</button>
              <button type="button" className="submit-btn" style={{ background: 'var(--gray-400)' }} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
            {msg && <p style={{ marginTop: '.5rem', color: 'var(--danger)', fontSize: '.875rem' }}>{msg}</p>}
          </form>
        </div>
      )}

      {/* Invoices Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>Invoices</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Total</th><th>Discount</th><th>Final</th>
                <th>Paid</th><th>Remaining</th><th>Status</th><th>Date</th>
                {perms.payments.add && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No invoices found</td></tr>
              ) : (
                filteredInvoices.map(inv => {
                  const paid = paidPerInvoice[inv.id] || 0;
                  const remaining = getRemaining(inv);
                  const realStatus = getRealStatus(inv);
                  const paidPercent = inv.final > 0 ? Math.min((paid / inv.final) * 100, 100) : 0;

                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.patientName}</td>
                      <td>${inv.total.toFixed(2)}</td>
                      <td style={{ color: inv.discount > 0 ? 'var(--success)' : undefined }}>
                        {inv.discount > 0 ? `-$${inv.discount.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ fontWeight: 700 }}>${inv.final.toFixed(2)}</td>
                      <td>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>${paid.toFixed(2)}</span>
                      </td>
                      <td>
                        {remaining > 0 ? (
                          <div>
                            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>${remaining.toFixed(2)}</span>
                            {/* Progress bar */}
                            <div style={{ width: '100%', height: 4, background: 'var(--gray-200)', borderRadius: 2, marginTop: 4, minWidth: 60 }}>
                              <div style={{ width: `${paidPercent}%`, height: '100%', background: paidPercent >= 100 ? '#10b981' : '#f59e0b', borderRadius: 2, transition: 'width .3s' }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>$0.00 ✓</span>
                        )}
                      </td>
                      <td><span className={statusBadge(realStatus)}>{realStatus}</span></td>
                      <td style={{ fontSize: '.85rem', color: 'var(--gray-500)' }}>{inv.createdAt}</td>
                      {perms.payments.add && (
                        <td>
                          {realStatus !== 'Paid' && (
                            <button className="tbl-btn" onClick={() => openPayForm(inv.id)}>
                              💳 Pay
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
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
              <tr><th>Patient</th><th>Amount</th><th>Method</th><th>Date</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No payments found</td></tr>
              ) : (
                [...filteredPayments].reverse().map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.patientName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${p.amount.toFixed(2)}</td>
                    <td><span className="badge badge-scheduled">{p.method}</span></td>
                    <td>{p.date}</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
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
