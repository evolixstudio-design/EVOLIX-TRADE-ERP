import { useState, useEffect } from 'react';
import { useAuthStore } from '../../shared/store/authStore';

export default function PosCheckout() {
  const tenantContext = useAuthStore((s) => s.tenantContext);
  const [shift, setShift] = useState<any>(null);
  const [heldBills] = useState<any[]>([]);

  useEffect(() => {
    // Fetch current shift and held bills
  }, [tenantContext?.branch_id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">POS Checkout</h1>
      {!shift ? (
        <div className="card">
          <h2>Open Shift</h2>
          <p className="text-muted mb-4">Start a new POS shift to begin billing.</p>
          <button className="btn btn-primary" onClick={() => setShift({ id: 'temp' })}>Open Shift</button>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-title">Cart</div>
            <div style={{ minHeight: '300px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
              <p className="text-muted text-center" style={{ paddingTop: '6rem' }}>Scan or search items to add to cart</p>
            </div>
            <div className="flex justify-between">
              <button className="btn btn-secondary">Hold Bill</button>
              <button className="btn btn-success">Checkout (Cash)</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Held Bills</div>
            {heldBills.length === 0 ? (
              <p className="text-muted">No held bills</p>
            ) : (
              heldBills.map(b => (
                <div key={b.id} className="activity-item">
                  <span>{b.reference_name}</span>
                  <button className="btn btn-sm btn-secondary">Resume</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
