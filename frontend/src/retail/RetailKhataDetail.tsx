/**
 * EVOLIX Retail V1 — Customer Khata Detail
 * 
 * Shows total receivable from customer, primary actions (Receive Payment, New Bill),
 * and a simple timeline of transactions (Sales & Payments).
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, IndianRupee, Plus, Phone, MessageCircle
} from 'lucide-react';
import { khataApi, type RetailCustomer, type RetailKhataTransaction } from './retailApi';

const RetailKhataDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<RetailCustomer | null>(null);
  const [transactions, setTransactions] = useState<RetailKhataTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!id) return;
      try {
        const res = await khataApi.getTimeline(id);
        const data = res.data?.data;
        if (data) {
          setCustomer(data.customer as any); // Assuming customer info is returned
          setTransactions(data.transactions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [id]);

  if (loading) return <div>Loading...</div>;

  if (!customer) {
    return (
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate('/retail/khata')}>
          <ArrowLeft size={22} />
        </button>
        <h1>Customer Not Found</h1>
        <div style={{ width: 48 }} />
      </div>
    );
  }

  return (
    <div className="r-page-with-sticky" style={{ paddingBottom: 0 }}>
      {/* Header */}
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate('/retail/khata')}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--r-text-lg)', marginBottom: 2 }}>{customer.name}</h1>
          <div style={{ fontSize: 'var(--r-text-xs)', color: 'var(--r-text-muted)' }}>
            {customer.mobile || 'No mobile'}
          </div>
        </div>
        <div style={{ width: 48 }} />
      </div>

      {/* Balance Summary */}
      <div className="r-section" style={{ paddingTop: 'var(--r-space-md)' }}>
        <div style={{
          textAlign: 'center', padding: 'var(--r-space-xl) var(--r-space-base)',
          background: 'var(--r-surface)', borderRadius: 'var(--r-radius)',
          border: '1px solid var(--r-border-light)'
        }}>
          <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-secondary)', marginBottom: 'var(--r-space-xs)' }}>
            You'll Receive
          </div>
          <div style={{
            fontSize: 'var(--r-text-4xl)', fontWeight: 800,
            color: customer.outstanding_amount > 0 ? 'var(--r-danger)' : 'var(--r-text)',
            letterSpacing: '-0.02em'
          }}>
            ₹{customer.outstanding_amount.toLocaleString('en-IN')}
          </div>

          <div style={{ display: 'flex', gap: 'var(--r-space-sm)', marginTop: 'var(--r-space-lg)' }}>
            <button
              className="r-btn r-btn--primary"
              style={{ flex: 1, padding: 'var(--r-space-sm) var(--r-space-md)' }}
              onClick={() => navigate(`/retail/receive-payment?customer=${customer.id}`)}
              id="receive-payment-btn"
            >
              <IndianRupee size={16} />
              Receive
            </button>
            <button
              className="r-btn r-btn--secondary"
              style={{ flex: 1, padding: 'var(--r-space-sm) var(--r-space-md)' }}
              onClick={() => navigate(`/retail/bill?customer=${customer.id}`)}
              id="new-bill-customer-btn"
            >
              <Plus size={16} />
              Bill
            </button>
          </div>

          {customer.mobile && (
            <div style={{ display: 'flex', gap: 'var(--r-space-sm)', marginTop: 'var(--r-space-sm)' }}>
              <a href={`tel:${customer.mobile}`} className="r-btn r-btn--ghost r-btn--sm r-btn--full">
                <Phone size={16} /> Call
              </a>
              <a href={`https://wa.me/91${customer.mobile}`} target="_blank" rel="noreferrer" className="r-btn r-btn--ghost r-btn--sm r-btn--full" style={{ color: '#25D366' }}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="r-section">
        <h3 className="r-section-title">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="r-empty" style={{ padding: 'var(--r-space-xl) 0' }}>
            <p>No transactions yet</p>
          </div>
        ) : (
          <ul className="r-timeline">
            {transactions.map((txn) => (
              <li key={txn.id} className="r-timeline-item">
                <div className={`r-timeline-dot ${txn.type === 'PAYMENT' ? 'r-timeline-dot--green' : txn.type === 'SALE' ? 'r-timeline-dot--red' : 'r-timeline-dot--blue'}`} />
                <div className="r-timeline-content">
                  <div>
                    <div className="r-timeline-text">{txn.reference || txn.type}</div>
                    <div className="r-timeline-date">{new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`r-timeline-amount ${txn.type === 'SALE' ? 'r-timeline-amount--credit' : txn.type === 'PAYMENT' ? 'r-timeline-amount--debit' : ''}`}>
                      {txn.type === 'PAYMENT' ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 'var(--r-text-xs)', color: 'var(--r-text-muted)' }}>
                      Bal: ₹{txn.balance_after.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RetailKhataDetail;
