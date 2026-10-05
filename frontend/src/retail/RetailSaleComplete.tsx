/**
 * EVOLIX Retail V1 — Sale Complete / Success Screen
 * 
 * Simple success screen showing amount received,
 * invoice number, and payment mode.
 * Actions: New Bill, Print, Share
 */
import { useNavigate } from 'react-router-dom';
import {
  Check, Plus, Printer, Share2, Eye
} from 'lucide-react';
import { useSaleCompleteStore } from './retailStore';

const RetailSaleComplete = () => {
  const navigate = useNavigate();
  const { completedSale, clearCompletedSale } = useSaleCompleteStore();

  // Redirect if no completed sale
  if (!completedSale) {
    navigate('/retail/home', { replace: true });
    return null;
  }

  const handleNewBill = () => {
    clearCompletedSale();
    navigate('/retail/bill', { replace: true });
  };

  return (
    <div className="r-success-screen">
      {/* Success Icon */}
      <div className="r-success-icon" id="success-indicator">
        <Check strokeWidth={3} />
      </div>

      {/* Amount */}
      <div className="r-success-amount">
        ₹{completedSale.amount.toLocaleString('en-IN')}
      </div>
      <div className="r-success-label">
        {completedSale.payment_mode === 'Udhar' ? 'Saved as Udhar' : 'Payment Received'}
      </div>

      {/* Details */}
      <div className="r-success-details">
        <div className="r-success-detail-row">
          <span>Invoice</span>
          <span>{completedSale.invoice_number}</span>
        </div>
        <div className="r-success-detail-row">
          <span>Customer</span>
          <span>{completedSale.customer_name}</span>
        </div>
        <div className="r-success-detail-row">
          <span>Items</span>
          <span>{completedSale.items_count}</span>
        </div>
        <div className="r-success-detail-row">
          <span>Payment</span>
          <span>{completedSale.payment_mode}</span>
        </div>
        <div className="r-success-detail-row">
          <span>Time</span>
          <span>{completedSale.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="r-success-actions">
        <button
          className="r-btn r-btn--primary-lg"
          onClick={handleNewBill}
          id="new-bill-btn"
        >
          <Plus size={20} />
          New Bill
        </button>

        <div style={{ display: 'flex', gap: 'var(--r-space-md)' }}>
          <button className="r-btn r-btn--secondary" style={{ flex: 1 }} id="print-btn">
            <Printer size={18} />
            Print
          </button>
          <button className="r-btn r-btn--secondary" style={{ flex: 1 }} id="share-btn">
            <Share2 size={18} />
            Share
          </button>
        </div>

        <button
          className="r-btn r-btn--ghost r-btn--full"
          onClick={() => {
            clearCompletedSale();
            navigate('/retail/home');
          }}
          id="view-bill-btn"
          style={{ color: 'var(--r-primary)' }}
        >
          <Eye size={16} />
          View Bill
        </button>
      </div>
    </div>
  );
};

export default RetailSaleComplete;
