import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supplierApi } from './retailApi';
import './retail.css';

export default function RetailPaySupplier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    try {
      setSaving(true);
      await supplierApi.paySupplier(id!, {
        amount: Number(amount),
        payment_method: method,
        note
      });
      navigate(`/retail/suppliers/${id}`);
    } catch (err) {
      console.error(err);
      alert('Error recording payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="retail-page">
      <div className="retail-header">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2>Pay Supplier</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="retail-content" style={{ padding: '16px' }}>
        <form onSubmit={handlePay}>
          <div className="amount-input-container" style={{ margin: '32px 0', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', color: '#d9534f', fontWeight: 'bold' }}>₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              style={{
                fontSize: '48px',
                width: '60%',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                color: '#d9534f',
                fontWeight: 'bold',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                type="button" 
                className={`retail-button ${method === 'CASH' ? 'primary' : 'outline'}`}
                onClick={() => setMethod('CASH')}
                style={method === 'CASH' ? { backgroundColor: '#d9534f' } : { borderColor: '#d9534f', color: '#d9534f' }}
              >
                Cash
              </button>
              <button 
                type="button" 
                className={`retail-button ${method === 'BANK' ? 'primary' : 'outline'}`}
                onClick={() => setMethod('BANK')}
                style={method === 'BANK' ? { backgroundColor: '#d9534f' } : { borderColor: '#d9534f', color: '#d9534f' }}
              >
                Bank / UPI
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Note (Optional)</label>
            <input 
              type="text" 
              className="retail-input" 
              placeholder="e.g. Cleared pending dues"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="bottom-sticky-bar">
            <button 
              type="submit" 
              className="retail-button primary full-width" 
              disabled={saving || !amount || Number(amount) <= 0}
              style={{ backgroundColor: '#d9534f', padding: '16px', fontSize: '18px' }}
            >
              {saving ? 'Processing...' : `PAY ₹${amount || 0}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
