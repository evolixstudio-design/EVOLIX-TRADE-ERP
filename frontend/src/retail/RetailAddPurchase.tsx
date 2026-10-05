import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseApi, supplierApi, type RetailSupplier } from './retailApi';
import './retail.css';

export default function RetailAddPurchase() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<RetailSupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('CREDIT'); // CREDIT, PAID, PARTIAL
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supplierApi.getSuppliers().then(res => {
      setSuppliers(res.data.data);
    }).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !totalAmount) return;
    
    try {
      setSaving(true);
      await purchaseApi.createPurchase({
        supplier_id: selectedSupplier,
        total_amount: Number(totalAmount),
        payment_status: paymentStatus,
        paid_amount: paymentStatus === 'PAID' ? Number(totalAmount) : (paymentStatus === 'PARTIAL' ? Number(paidAmount) : 0),
        payment_method: (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') ? paymentMethod : undefined
      });
      navigate('/retail/purchases');
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase');
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
        <h2>Quick Bill Record</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="retail-content" style={{ padding: '16px' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Select Supplier</label>
            <select className="retail-input" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} required>
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Total Bill Amount</label>
            <input 
              type="number" 
              className="retail-input" 
              placeholder="0.00" 
              value={totalAmount} 
              onChange={e => setTotalAmount(e.target.value)} 
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Payment Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button type="button" className={`retail-button ${paymentStatus === 'CREDIT' ? 'primary' : 'outline'}`} onClick={() => setPaymentStatus('CREDIT')}>Credit</button>
              <button type="button" className={`retail-button ${paymentStatus === 'PARTIAL' ? 'primary' : 'outline'}`} onClick={() => setPaymentStatus('PARTIAL')}>Partial</button>
              <button type="button" className={`retail-button ${paymentStatus === 'PAID' ? 'primary' : 'outline'}`} onClick={() => setPaymentStatus('PAID')}>Paid</button>
            </div>
          </div>

          {paymentStatus === 'PARTIAL' && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Amount Paid Now</label>
              <input 
                type="number" 
                className="retail-input" 
                placeholder="0.00" 
                value={paidAmount} 
                onChange={e => setPaidAmount(e.target.value)} 
                required
              />
            </div>
          )}

          {(paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Payment Method</label>
              <select className="retail-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank / UPI</option>
              </select>
            </div>
          )}

          <div style={{ marginTop: '32px', textAlign: 'center', color: '#666', fontSize: '0.9em' }}>
            Quick Bill Record does NOT automatically update item-wise stock.
          </div>

          <div className="bottom-sticky-bar">
            <button type="submit" className="retail-button primary full-width" disabled={saving || !selectedSupplier || !totalAmount}>
              {saving ? 'Saving...' : 'SAVE PURCHASE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
