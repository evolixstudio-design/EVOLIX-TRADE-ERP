/**
 * EVOLIX Retail V1 — Receive Payment
 * 
 * Simple form to record customer payments.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Check
} from 'lucide-react';
import { useEffect } from 'react';
import { khataApi, type RetailCustomer } from './retailApi';

const RetailReceivePayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer');

  const [customer, setCustomer] = useState<RetailCustomer | null>(null);
  const [customersWithBalance, setCustomersWithBalance] = useState<RetailCustomer[]>([]);
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [note, setNote] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await khataApi.getCustomers();
        const data = res.data?.data || [];
        setCustomersWithBalance(data.filter(c => c.outstanding_amount > 0));
        if (initialCustomerId) {
          setCustomer(data.find(c => c.id === initialCustomerId) || null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, [initialCustomerId]);

  const handleSave = async () => {
    if (!customer || !amount) return;

    setSaving(true);
    // Call API
    try {
      await khataApi.receivePayment(customer.id, {
        amount: parseFloat(amount),
        payment_method: method,
        note: note.trim()
      });
    } catch (e) {
      console.error(e);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      navigate(`/retail/khata/${customer.id}`, { replace: true });
    }, 1500);
  };

  if (saved) {
    const amt = parseFloat(amount) || 0;
    const newBal = customer ? Math.max(0, customer.outstanding_amount - amt) : 0;
    
    return (
      <div className="r-success-screen" style={{ minHeight: '80vh' }}>
        <div className="r-success-icon">
          <Check strokeWidth={3} />
        </div>
        <div style={{ fontSize: 'var(--r-text-xl)', fontWeight: 700, marginBottom: 4 }}>
          Payment Saved!
        </div>
        <div style={{ color: 'var(--r-text-secondary)', marginBottom: 'var(--r-space-2xl)' }}>
          Received ₹{amt.toLocaleString('en-IN')} from {customer?.name}
        </div>
        
        <div className="r-card" style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-secondary)', marginBottom: 4 }}>
            Remaining Balance
          </div>
          <div style={{ fontSize: 'var(--r-text-2xl)', fontWeight: 700, color: newBal > 0 ? 'var(--r-danger)' : 'var(--r-success)' }}>
            ₹{newBal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="r-page-with-sticky">
      {/* Header */}
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>Receive Payment</h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="r-section">
        {/* Customer Select */}
        <div className="r-input-group">
          <label className="r-label">Customer *</label>
          {initialCustomerId && customer ? (
            <div className="r-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{customer.name}</span>
              <span style={{ color: 'var(--r-danger)', fontWeight: 600 }}>Due: ₹{customer.outstanding_amount.toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <select
              className="r-select"
              value={customer?.id || ''}
              onChange={(e) => {
                const c = customersWithBalance.find(cust => cust.id === e.target.value);
                setCustomer(c || null);
              }}
            >
              <option value="">Select customer with dues</option>
              {customersWithBalance.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Due: ₹{c.outstanding_amount})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount */}
        <div className="r-input-group">
          <label className="r-label">Amount Received (₹) *</label>
          <input
            type="number"
            className="r-input r-input--lg"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus={!!initialCustomerId}
          />
        </div>

        {/* Date (mocked as today for simplicity) */}
        <div className="r-input-group">
          <label className="r-label">Date</label>
          <input
            type="text"
            className="r-input"
            value="Today"
            disabled
            style={{ background: 'var(--r-bg-grey)', color: 'var(--r-text-muted)' }}
          />
        </div>

        {/* Payment Method */}
        <div className="r-input-group">
          <label className="r-label">Payment Method</label>
          <select
            className="r-select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK">Bank Transfer</option>
          </select>
        </div>

        {/* Note */}
        <div className="r-input-group">
          <label className="r-label">Note <span style={{ color: 'var(--r-text-muted)', fontWeight: 400 }}>optional</span></label>
          <input
            type="text"
            className="r-input"
            placeholder="e.g. Cleared old bill"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="r-sticky-footer">
        <button
          className="r-btn r-btn--primary-lg"
          onClick={handleSave}
          disabled={!customer || !amount || parseFloat(amount) <= 0 || saving}
          id="receive-payment-save-btn"
        >
          {saving ? 'Saving...' : `RECEIVE ₹${parseFloat(amount) ? parseFloat(amount).toLocaleString('en-IN') : '0'}`}
        </button>
      </div>
    </div>
  );
};

export default RetailReceivePayment;
