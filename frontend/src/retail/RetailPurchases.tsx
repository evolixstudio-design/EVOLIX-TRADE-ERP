import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseApi, type RetailPurchase } from './retailApi';
import { AttachmentPicker } from '../shared/components/AttachmentPicker';
import './retail.css';

export default function RetailPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<RetailPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await purchaseApi.getPurchases();
      setPurchases(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        <h2>Purchases</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="retail-content">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : purchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p>No purchases found</p>
          </div>
        ) : (
          <div className="item-list">
            {purchases.map(purchase => (
              <div key={purchase.id} className="item-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                <div 
                  className="item-card" 
                  style={{ cursor: 'pointer', border: 'none', padding: 0, margin: 0, boxShadow: 'none' }}
                  onClick={() => setExpandedId(expandedId === purchase.id ? null : purchase.id)}
                >
                  <div className="item-info">
                    <div className="item-name">{purchase.party?.name || 'Unknown Supplier'}</div>
                    <div className="item-meta">
                      {new Date(purchase.document_date).toLocaleDateString()} • {purchase.document_number}
                      {purchase.attachment && <span> • 📸</span>}
                    </div>
                  </div>
                  <div className="item-price" style={{ textAlign: 'right' }}>
                    ₹{Number(purchase.grand_total).toFixed(2)}
                    {Number(purchase.outstanding_amount) > 0 && (
                      <div style={{ fontSize: '0.8em', color: '#d9534f' }}>
                        ₹{Number(purchase.outstanding_amount).toFixed(2)} Due
                      </div>
                    )}
                    {Number(purchase.outstanding_amount) <= 0 && (
                      <div style={{ fontSize: '0.8em', color: '#22c55e' }}>Paid</div>
                    )}
                  </div>
                </div>
                {expandedId === purchase.id && (
                  <div style={{ marginTop: '8px' }}>
                    <AttachmentPicker 
                      existingAttachmentUrl={purchase.attachment ? `/api/v1/attachments/${purchase.attachment.id}/content` : undefined}
                      uploadImmediately={{
                        entityType: 'PURCHASE',
                        entityId: purchase.id,
                        category: 'PURCHASE_BILL'
                      }}
                      onUploadSuccess={() => loadPurchases()}
                      onRemove={() => loadPurchases()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => navigate('/retail/purchases/new')}>
        +
      </button>
    </div>
  );
}
