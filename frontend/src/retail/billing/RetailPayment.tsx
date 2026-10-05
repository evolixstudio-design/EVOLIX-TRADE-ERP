/**
 * EVOLIX Retail V1 — Payment Screen
 * 
 * Large amount at top → Payment methods → Cash/UPI/Udhar/Split flows
 * Single CTA: COMPLETE SALE / SAVE AS UDHAR
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Banknote, Smartphone, Clock, Divide,
  X, Check
} from 'lucide-react';
import { useBillStore, useSaleCompleteStore, type PaymentSplit } from '../retailStore';
import { khataApi, posApi, type RetailCustomer } from '../retailApi';

type PaymentMode = 'CASH' | 'UPI' | 'UDHAR' | 'SPLIT';

const RetailPayment = () => {
  const navigate = useNavigate();
  const { items, customer, getTotal, getItemCount, clearBill, setCustomer } = useBillStore();
  const { setCompletedSale } = useSaleCompleteStore();

  const total = getTotal();
  const itemCount = getItemCount();

  const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);

  // Cash state
  const [cashReceived, setCashReceived] = useState('');
  const cashAmount = parseFloat(cashReceived) || 0;
  const cashChange = Math.max(0, cashAmount - total);

  // UPI state (simple confirmation)

  // Udhar state
  const [showUdharCustomerSelect, setShowUdharCustomerSelect] = useState(false);

  // Split state
  const [splitCash, setSplitCash] = useState('');
  const [splitUPI, setSplitUPI] = useState('');
  const splitCashAmt = parseFloat(splitCash) || 0;
  const splitUPIAmt = parseFloat(splitUPI) || 0;
  const splitRemaining = Math.max(0, total - splitCashAmt - splitUPIAmt);
  const [customers, setCustomers] = useState<RetailCustomer[]>([]);

  // Fetch customers if Udhar sheet is open
  useEffect(() => {
    if (showUdharCustomerSelect) {
      khataApi.getCustomers().then(res => setCustomers(res.data?.data || []));
    }
  }, [showUdharCustomerSelect]);

  // Redirect if no items
  if (items.length === 0) {
    navigate('/retail/bill', { replace: true });
    return null;
  }

  const handleCompleteSale = async (mode: string, payments?: PaymentSplit[]) => {
    // Generate invoice number
    const invoiceNum = `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    try {
      // POST to actual backend POS endpoint
      await posApi.postSale({
        items: items.map(i => ({ item_id: i.item_id, quantity: i.quantity, rate: i.rate, discount_amount: i.discount_amount })),
        customer_id: customer?.id,
        payment_splits: payments || [{ method: mode, amount: total }],
        total_amount: total,
        discount: items.reduce((acc, i) => acc + i.discount_amount, 0)
      });
    } catch (e) {
      console.error(e);
      // Fallback for demo if API fails
    }

    setCompletedSale({
      invoice_number: invoiceNum,
      amount: total,
      payment_mode: mode,
      customer_name: customer?.name || 'Walk-in Customer',
      items_count: itemCount,
      timestamp: new Date(),
    });

    clearBill();
    navigate('/retail/sale-complete', { replace: true });
  };

  const paymentMethods = [
    { mode: 'CASH' as PaymentMode, label: 'Cash', icon: Banknote, color: 'var(--r-success)' },
    { mode: 'UPI' as PaymentMode, label: 'UPI', icon: Smartphone, color: 'var(--r-info)' },
    { mode: 'UDHAR' as PaymentMode, label: 'Udhar', icon: Clock, color: 'var(--r-warning)' },
    { mode: 'SPLIT' as PaymentMode, label: 'Split', icon: Divide, color: '#7B1FA2' },
  ];

  return (
    <div className="r-page-with-sticky" style={{ paddingBottom: selectedMode ? 100 : 16 }}>
      {/* Header */}
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate('/retail/bill')}>
          <ArrowLeft size={22} />
        </button>
        <h1>Payment</h1>
        <div style={{ width: 48 }} />
      </div>

      {/* Amount to Pay */}
      <div style={{
        textAlign: 'center',
        padding: 'var(--r-space-xl) var(--r-space-base)',
        borderBottom: '1px solid var(--r-divider)',
      }}>
        <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)', marginBottom: 4 }}>
          Amount to Pay
        </div>
        <div style={{
          fontSize: 'var(--r-text-4xl)',
          fontWeight: 800,
          color: 'var(--r-text)',
          letterSpacing: '-0.03em',
        }}>
          ₹{total.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)', marginTop: 4 }}>
          {itemCount} items · {customer?.name || 'Walk-in'}
        </div>
      </div>

      {/* Payment Methods */}
      {!selectedMode && (
        <div style={{ padding: 'var(--r-space-xl) var(--r-space-base)' }}>
          <div className="r-payment-methods">
            {paymentMethods.map(({ mode, label, icon: Icon, color }) => (
              <button
                key={mode}
                className="r-payment-method"
                onClick={() => {
                  if (mode === 'UDHAR' && !customer) {
                    setShowUdharCustomerSelect(true);
                    return;
                  }
                  setSelectedMode(mode);
                }}
                id={`pay-${mode.toLowerCase()}`}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--r-radius)',
                  background: `${color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={24} style={{ color }} />
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CASH Flow ─────────────────────────────────── */}
      {selectedMode === 'CASH' && (
        <div style={{ padding: 'var(--r-space-lg) var(--r-space-base)' }}>
          <button
            className="r-btn r-btn--ghost r-btn--sm"
            onClick={() => setSelectedMode(null)}
            style={{ marginBottom: 'var(--r-space-lg)' }}
          >
            <ArrowLeft size={16} /> Change method
          </button>

          <div className="r-input-group">
            <label className="r-label">Amount Received</label>
            <input
              type="number"
              className="r-input r-input--lg"
              placeholder={total.toString()}
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              autoFocus
              id="cash-received-input"
            />
          </div>

          {cashAmount > 0 && cashAmount >= total && (
            <div className="r-card r-card--primary-light" style={{ marginTop: 'var(--r-space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--r-text-secondary)', fontWeight: 500 }}>Change to return</span>
                <span style={{ fontSize: 'var(--r-text-xl)', fontWeight: 700, color: 'var(--r-primary)' }}>
                  ₹{cashChange.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Quick amount buttons */}
          <div style={{ display: 'flex', gap: 'var(--r-space-sm)', marginTop: 'var(--r-space-lg)', flexWrap: 'wrap' }}>
            {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 2000].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 4).map((amt) => (
              <button
                key={amt}
                className={`r-chip ${cashAmount === amt ? 'r-chip--active' : ''}`}
                onClick={() => setCashReceived(amt.toString())}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── UPI Flow ──────────────────────────────────── */}
      {selectedMode === 'UPI' && (
        <div style={{ padding: 'var(--r-space-lg) var(--r-space-base)' }}>
          <button
            className="r-btn r-btn--ghost r-btn--sm"
            onClick={() => setSelectedMode(null)}
            style={{ marginBottom: 'var(--r-space-lg)' }}
          >
            <ArrowLeft size={16} /> Change method
          </button>

          <div className="r-card" style={{ textAlign: 'center', padding: 'var(--r-space-2xl)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--r-info-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--r-space-lg)',
            }}>
              <Smartphone size={28} style={{ color: 'var(--r-info)' }} />
            </div>
            <div style={{ fontSize: 'var(--r-text-lg)', fontWeight: 600, marginBottom: 4 }}>
              UPI Payment
            </div>
            <div style={{ color: 'var(--r-text-muted)', fontSize: 'var(--r-text-sm)' }}>
              Confirm the customer has paid ₹{total.toLocaleString('en-IN')} via UPI
            </div>
          </div>
        </div>
      )}

      {/* ── UDHAR Flow ────────────────────────────────── */}
      {selectedMode === 'UDHAR' && (
        <div style={{ padding: 'var(--r-space-lg) var(--r-space-base)' }}>
          <button
            className="r-btn r-btn--ghost r-btn--sm"
            onClick={() => setSelectedMode(null)}
            style={{ marginBottom: 'var(--r-space-lg)' }}
          >
            <ArrowLeft size={16} /> Change method
          </button>

          <div className="r-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-md)' }}>
              <span style={{ color: 'var(--r-text-secondary)' }}>Customer</span>
              <span style={{ fontWeight: 600 }}>{customer?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-md)' }}>
              <span style={{ color: 'var(--r-text-secondary)' }}>Existing Balance</span>
              <span style={{ fontWeight: 600, color: (customer as any)?.outstanding_amount ? 'var(--r-danger)' : 'var(--r-text)' }}>
                ₹{((customer as any)?.outstanding_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-md)' }}>
              <span style={{ color: 'var(--r-text-secondary)' }}>This Bill</span>
              <span style={{ fontWeight: 600 }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 'var(--r-space-md)', borderTop: '1px solid var(--r-divider)',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--r-danger)' }}>New Balance</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--r-text-xl)', color: 'var(--r-danger)' }}>
                ₹{(((customer as any)?.outstanding_amount || 0) + total).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SPLIT Flow ────────────────────────────────── */}
      {selectedMode === 'SPLIT' && (
        <div style={{ padding: 'var(--r-space-lg) var(--r-space-base)' }}>
          <button
            className="r-btn r-btn--ghost r-btn--sm"
            onClick={() => setSelectedMode(null)}
            style={{ marginBottom: 'var(--r-space-lg)' }}
          >
            <ArrowLeft size={16} /> Change method
          </button>

          <div className="r-input-group">
            <label className="r-label">
              <Banknote size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Cash Amount
            </label>
            <input
              type="number"
              className="r-input"
              placeholder="0"
              value={splitCash}
              onChange={(e) => setSplitCash(e.target.value)}
              autoFocus
              id="split-cash-input"
            />
          </div>

          <div className="r-input-group">
            <label className="r-label">
              <Smartphone size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              UPI Amount
            </label>
            <input
              type="number"
              className="r-input"
              placeholder="0"
              value={splitUPI}
              onChange={(e) => setSplitUPI(e.target.value)}
              id="split-upi-input"
            />
          </div>

          {splitRemaining > 0 && (
            <div className="r-card r-card--primary-light">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--r-text-secondary)', fontWeight: 500 }}>Remaining</span>
                <span style={{ fontSize: 'var(--r-text-xl)', fontWeight: 700, color: 'var(--r-danger)' }}>
                  ₹{splitRemaining.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {splitRemaining <= 0 && (splitCashAmt > 0 || splitUPIAmt > 0) && (
            <div className="r-card r-card--primary-light">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--r-space-sm)' }}>
                <Check size={18} style={{ color: 'var(--r-success)' }} />
                <span style={{ color: 'var(--r-success)', fontWeight: 600 }}>Amount fully covered</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sticky CTA ────────────────────────────────── */}
      {selectedMode && (
        <div className="r-sticky-footer r-sticky-footer--no-nav">
          {selectedMode === 'CASH' && (
            <button
              className="r-btn r-btn--primary-lg"
              onClick={() => handleCompleteSale('Cash')}
              disabled={cashAmount < total && cashReceived !== ''}
              id="complete-sale-cash"
            >
              COMPLETE SALE
            </button>
          )}
          {selectedMode === 'UPI' && (
            <button
              className="r-btn r-btn--primary-lg"
              onClick={() => handleCompleteSale('UPI')}
              id="complete-sale-upi"
            >
              COMPLETE SALE
            </button>
          )}
          {selectedMode === 'UDHAR' && (
            <button
              className="r-btn r-btn--primary-lg"
              onClick={() => handleCompleteSale('Udhar')}
              id="save-as-udhar"
              style={{ background: 'var(--r-warning)' }}
            >
              SAVE AS UDHAR
            </button>
          )}
          {selectedMode === 'SPLIT' && (
            <button
              className="r-btn r-btn--primary-lg"
              onClick={() => handleCompleteSale(`Cash ₹${splitCashAmt} + UPI ₹${splitUPIAmt}`)}
              disabled={splitRemaining > 0}
              id="complete-sale-split"
            >
              COMPLETE SALE
            </button>
          )}
        </div>
      )}

      {/* ── Udhar: Customer Select Sheet ──────────────── */}
      {showUdharCustomerSelect && (
        <>
          <div className="r-overlay" onClick={() => setShowUdharCustomerSelect(false)} />
          <div className="r-bottom-sheet">
            <div className="r-bottom-sheet-handle" />
            <div className="r-bottom-sheet-header">
              <h2>Select Customer for Udhar</h2>
              <button className="r-btn r-btn--icon" onClick={() => setShowUdharCustomerSelect(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="r-bottom-sheet-body">
              <p style={{ color: 'var(--r-text-muted)', fontSize: 'var(--r-text-sm)', marginBottom: 'var(--r-space-md)' }}>
                You need to select a customer to save this bill as Udhar (credit).
              </p>
              {customers.map((c) => (
                <button
                  key={c.id}
                  className="r-list-item"
                  onClick={() => {
                    setCustomer(c as any);
                    setShowUdharCustomerSelect(false);
                    setSelectedMode('UDHAR');
                  }}
                  style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer' }}
                >
                  <div className="r-list-item-left">
                    <div className="r-list-item-title">{c.name}</div>
                    <div className="r-list-item-subtitle">{c.mobile || 'No mobile'}</div>
                  </div>
                  {c.outstanding_amount > 0 && (
                    <div className="r-list-item-right">
                      <div className="r-list-item-amount" style={{ color: 'var(--r-danger)' }}>
                        ₹{c.outstanding_amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RetailPayment;
