import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supplierApi, type RetailKhataTransaction, type RetailSupplier } from './retailApi';
import { AttachmentPicker } from '../shared/components/AttachmentPicker';
import './retail.css';

export default function RetailSupplierKhata() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<RetailSupplier | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<RetailKhataTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadKhata();
  }, [id]);

  const loadKhata = async () => {
    try {
      setLoading(true);
      const res = await supplierApi.getTimeline(id!);
      setSupplier(res.data.data.supplier);
      setBalance(res.data.data.balance);
      setTransactions(res.data.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="retail-page"><div className="empty-state">Loading...</div></div>;
  }

  return (
    <div className="retail-page">
      <div className="retail-header">
        <button className="icon-button" onClick={() => navigate('/retail/suppliers')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2>{supplier?.name}</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="khata-summary" style={{ backgroundColor: '#fff5f5' }}>
        <div className="khata-title" style={{ color: '#d9534f' }}>You Have to Pay</div>
        <div className="khata-amount" style={{ color: '#d9534f' }}>₹{Math.abs(balance).toFixed(2)}</div>
        
        <div className="khata-actions">
          <button className="retail-button primary" onClick={() => navigate(`/retail/suppliers/${id}/pay`)} style={{ backgroundColor: '#d9534f' }}>
            Pay Supplier
          </button>
          <button className="retail-button outline" onClick={() => navigate('/retail/purchases/new')}>
            New Purchase
          </button>
        </div>
      </div>

      <div className="retail-content" style={{ padding: '0 16px' }}>
        <h3 style={{ margin: '16px 0', fontSize: '16px', color: '#666' }}>Timeline</h3>
        
        {transactions.length === 0 ? (
          <div className="empty-state">No transactions yet</div>
        ) : (
          <div className="timeline">
            {transactions.map(t => (
              <div key={t.id} className="timeline-item-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div 
                  className="timeline-item" 
                  style={{ margin: 0, cursor: 'pointer' }}
                  onClick={() => setExpandedTxnId(expandedTxnId === t.id ? null : t.id)}
                >
                  <div className="timeline-icon" style={{ backgroundColor: t.type === 'PURCHASE' ? '#fff5f5' : '#f0fdf4', color: t.type === 'PURCHASE' ? '#d9534f' : '#22c55e' }}>
                    {t.type === 'PURCHASE' ? '🛒' : '💸'}
                  </div>
                  <div className="timeline-details">
                    <div className="timeline-title">
                      {t.type === 'PURCHASE' ? 'Purchase' : 'Payment'}
                      {t.attachment && <span> 📸</span>}
                    </div>
                    <div className="timeline-date">{new Date(t.date).toLocaleDateString()}</div>
                  </div>
                  <div className="timeline-amounts">
                    <div className="timeline-amount" style={{ color: t.type === 'PURCHASE' ? '#d9534f' : '#22c55e' }}>
                      {t.type === 'PURCHASE' ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </div>
                    <div className="timeline-balance">Bal: ₹{Math.abs(t.balance_after).toFixed(2)}</div>
                  </div>
                </div>
                {expandedTxnId === t.id && (
                  <div style={{ paddingLeft: '48px' }}>
                    <AttachmentPicker 
                      existingAttachmentUrl={t.attachment ? `/api/v1/attachments/${t.attachment.id}/content` : undefined}
                      uploadImmediately={{
                        entityType: t.type === 'PURCHASE' ? 'PURCHASE' : 'SUPPLIER_PAYMENT',
                        entityId: t.reference_id || t.id,
                        category: t.type === 'PURCHASE' ? 'PURCHASE_BILL' : 'SUPPLIER_PAYMENT_PROOF'
                      }}
                      onUploadSuccess={() => loadKhata()}
                      onRemove={() => loadKhata()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
