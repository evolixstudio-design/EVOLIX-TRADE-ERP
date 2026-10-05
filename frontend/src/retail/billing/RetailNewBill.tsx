/**
 * EVOLIX Retail V1 — New Bill / POS Screen
 * 
 * The MOST IMPORTANT screen. Must feel extremely fast.
 * Search/scan → Add items → Qty controls → Sticky total → PAY
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillStore } from '../retailStore';
import { itemApi, khataApi, type RetailItem, type RetailCustomer } from '../retailApi';
import {
  Search, Camera, X, Minus, Plus, ChevronRight,
  User, Trash2, Pause, Receipt
} from 'lucide-react';

const RetailNewBill = () => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  // Bill state from store
  const {
    items: billItems,
    customer,
    discount: billDiscount,
    addItem,
    removeItem,
    updateQuantity,
    setCustomer,
    getSubtotal,
    getTotal,
    getItemCount,
  } = useBillStore();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RetailItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showItemEdit, setShowItemEdit] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<RetailCustomer[]>([]);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');

  // Remove autofocus on mount to prevent keyboard from popping up on mobile
  useEffect(() => {
    // Focus manually when user taps search
  }, []);

  // Debounced search for items
  useEffect(() => {
    const fetchItems = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await itemApi.getItems(searchQuery);
        setSearchResults(res.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    
    const timeoutId = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Debounced search for customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await khataApi.getCustomers(customerSearch);
        setCustomers(res.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    
    if (showCustomerSheet) {
      const timeoutId = setTimeout(fetchCustomers, 300);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [customerSearch, showCustomerSheet]);

  const handleAddItem = (item: RetailItem) => {
    if (item.current_stock <= 0) {
      // Do not allow adding out-of-stock items
      return;
    }
    addItem(item);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleCustomerSelect = (c: RetailCustomer) => {
    setCustomer(c as any); // temporary cast if store expects old interface
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };

  const handleNewCustomerSave = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const res = await khataApi.createCustomer({ name: newCustomerName.trim(), mobile: newCustomerMobile.trim() });
      if (res.data?.data) {
        setCustomer(res.data.data as any);
      }
    } catch (e) {
      console.error(e);
    }
    setShowCustomerSheet(false);
    setShowNewCustomerForm(false);
    setNewCustomerName('');
    setNewCustomerMobile('');
    setCustomerSearch('');
  };

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();

  // Get the currently editing bill item
  const editingItem = showItemEdit ? billItems.find(i => i.item_id === showItemEdit) : null;

  return (
    <>
      {/* Header */}
      <div className="r-page-header">
        <h1>New Bill</h1>
        <div className="r-page-header-action">
          {billItems.length > 0 && (
            <button
              className="r-btn r-btn--ghost r-btn--sm"
              onClick={async () => {
                try {
                  await posApi.holdBill('default-branch', billItems);
                  clearBill();
                  navigate('/retail/home');
                } catch (e) {
                  console.error(e);
                  alert('Failed to hold bill');
                }
              }}
              id="hold-bill-btn"
            >
              <Pause size={16} />
              Hold
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector */}
      <div className="r-section">
        <button
          className="r-card r-card--tappable r-flex r-items-center r-gap-md r-w-full"
          onClick={() => setShowCustomerSheet(true)}
          id="customer-selector"
          style={{ textAlign: 'left' }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--r-bg-grey)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--r-text-muted)', flexShrink: 0,
          }}>
            <User size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--r-text-base)', fontWeight: 500 }}>
              {customer ? customer.name : 'Walk-in Customer'}
            </div>
            {customer?.mobile && (
              <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)' }}>
                {customer.mobile}
              </div>
            )}
          </div>
          <ChevronRight size={18} style={{ color: 'var(--r-text-hint)' }} />
        </button>
      </div>

      {/* Item Search */}
      <div className="r-search-bar" style={{ position: 'relative' }}>
        <span className="r-search-icon"><Search size={20} /></span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search item / Scan barcode"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (searchQuery.trim().length > 0) setShowSearchResults(true);
          }}
          id="item-search-input"
        />
        <button className="r-search-action" id="scan-barcode-btn">
          <Camera size={18} />
        </button>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--r-bg)',
              border: '1px solid var(--r-border)',
              borderRadius: 'var(--r-radius)',
              boxShadow: 'var(--r-shadow-lg)',
              zIndex: 60,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {searchResults.map((item) => (
              <button
                key={item.id}
                className="r-list-item"
                onClick={() => handleAddItem(item)}
                style={{ border: 'none', background: 'none', width: '100%', cursor: item.current_stock <= 0 ? 'not-allowed' : 'pointer', opacity: item.current_stock <= 0 ? 0.6 : 1 }}
                disabled={item.current_stock <= 0}
              >
                <div className="r-list-item-left" style={{ minWidth: 0, flex: 1 }}>
                  <div className="r-list-item-title r-truncate">{item.name}</div>
                  <div className="r-list-item-subtitle">
                    {item.sku} · Stock: {item.current_stock} {item.unit}
                    {item.current_stock <= 0 && <span className="r-badge r-badge--danger" style={{ marginLeft: 4 }}>Out of Stock</span>}
                  </div>
                </div>
                <div className="r-list-item-right">
                  <div className="r-list-item-amount">₹{item.selling_price}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSearchResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--r-bg)',
              border: '1px solid var(--r-border)',
              borderRadius: 'var(--r-radius)',
              boxShadow: 'var(--r-shadow-lg)',
              zIndex: 60,
              padding: 'var(--r-space-lg)',
              textAlign: 'center',
              color: 'var(--r-text-muted)',
              fontSize: 'var(--r-text-sm)',
            }}
          >
            No items found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Click-away for search */}
      {showSearchResults && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 55 }}
          onClick={() => setShowSearchResults(false)}
        />
      )}

      {/* Bill Items */}
      <div className="r-section" style={{ paddingBottom: billItems.length > 0 ? 140 : 0 }}>
        {billItems.length === 0 ? (
          <div className="r-empty" style={{ paddingTop: 'var(--r-space-2xl)' }}>
            <Receipt size={48} style={{ color: 'var(--r-text-hint)' }} />
            <p style={{ marginTop: 'var(--r-space-md)' }}>
              Search or scan items to start billing
            </p>
          </div>
        ) : (
          billItems.map((item) => (
            <div className="r-bill-item" key={item.item_id} id={`bill-item-${item.item_id}`}>
              <div className="r-bill-item-info" style={{ minWidth: 0, flex: 1, paddingRight: 'var(--r-space-sm)' }}>
                <div className="r-bill-item-name r-truncate">{item.name}</div>
                <div className="r-bill-item-price">
                  ₹{item.rate} × {item.quantity}
                  {item.discount_amount > 0 && (
                    <span style={{ color: 'var(--r-success)', marginLeft: 4 }}>
                      (-₹{item.discount_amount})
                    </span>
                  )}
                </div>
              </div>
              <div className="r-bill-item-right">
                <div className="r-bill-item-total">₹{item.total.toLocaleString('en-IN')}</div>
                <div className="r-qty-control">
                  <button
                    className="r-qty-btn"
                    onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="r-qty-value">{item.quantity}</span>
                  <button
                    className="r-qty-btn"
                    onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky Billing Summary + PAY button */}
      <div className="r-sticky-footer" id="billing-footer">
        {billItems.length > 0 && (
          <div className="r-billing-summary">
            <div className="r-billing-row">
              <span>Subtotal ({itemCount} items)</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {billDiscount > 0 && (
              <div className="r-billing-row">
                <span>Discount</span>
                <span style={{ color: 'var(--r-success)' }}>-₹{billDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="r-billing-row r-billing-row--total">
              <span>TOTAL</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
        <button
          className="r-btn r-btn--primary-lg"
          onClick={() => navigate('/retail/payment')}
          id="pay-btn"
          style={{ marginTop: billItems.length > 0 ? 'var(--r-space-sm)' : 0 }}
          disabled={billItems.length === 0}
        >
          PAY ₹{total.toLocaleString('en-IN')}
        </button>
      </div>

      {/* ── Customer Bottom Sheet ─────────────────────── */}
      {showCustomerSheet && (
        <>
          <div className="r-overlay" onClick={() => { setShowCustomerSheet(false); setShowNewCustomerForm(false); }} />
          <div className="r-bottom-sheet" id="customer-sheet">
            <div className="r-bottom-sheet-handle" />
            <div className="r-bottom-sheet-header">
              <h2>{showNewCustomerForm ? 'New Customer' : 'Select Customer'}</h2>
              <button className="r-btn r-btn--icon" onClick={() => { setShowCustomerSheet(false); setShowNewCustomerForm(false); }}>
                <X size={20} />
              </button>
            </div>
            <div className="r-bottom-sheet-body">
              {!showNewCustomerForm ? (
                <>
                  {/* Search */}
                  <input
                    type="text"
                    className="r-input r-input--search"
                    placeholder="Search customer / mobile"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    id="customer-search-input"
                    autoFocus
                  />

                  {/* Walk-in option */}
                  <button
                    className="r-list-item"
                    onClick={() => {
                      setCustomer(null);
                      setShowCustomerSheet(false);
                    }}
                    style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', marginTop: 'var(--r-space-sm)' }}
                  >
                    <div className="r-list-item-left">
                      <div className="r-list-item-title">Walk-in Customer</div>
                      <div className="r-list-item-subtitle">No customer details</div>
                    </div>
                  </button>

                  {/* Customer list */}
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      className="r-list-item"
                      onClick={() => handleCustomerSelect(c)}
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
                          <span className="r-badge r-badge--danger">Due</span>
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Add new */}
                  <div style={{ padding: 'var(--r-space-md) 0' }}>
                    <button
                      className="r-btn r-btn--outline r-btn--full"
                      onClick={() => setShowNewCustomerForm(true)}
                      id="add-new-customer-btn"
                    >
                      <Plus size={18} />
                      Add New Customer
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Quick customer creation */}
                  <div className="r-input-group">
                    <label className="r-label">Customer Name</label>
                    <input
                      type="text"
                      className="r-input"
                      placeholder="Enter customer name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      autoFocus
                      id="new-customer-name"
                    />
                  </div>
                  <div className="r-input-group">
                    <label className="r-label">Mobile Number <span style={{ color: 'var(--r-text-muted)', fontWeight: 400 }}>optional</span></label>
                    <input
                      type="tel"
                      className="r-input"
                      placeholder="Enter mobile number"
                      value={newCustomerMobile}
                      onChange={(e) => setNewCustomerMobile(e.target.value)}
                      id="new-customer-mobile"
                    />
                  </div>
                  <button
                    className="r-btn r-btn--primary-lg"
                    onClick={handleNewCustomerSave}
                    disabled={!newCustomerName.trim()}
                    id="save-select-customer-btn"
                    style={{ marginTop: 'var(--r-space-md)' }}
                  >
                    SAVE & SELECT
                  </button>
                  <button
                    className="r-btn r-btn--ghost r-btn--full"
                    onClick={() => setShowNewCustomerForm(false)}
                    style={{ marginTop: 'var(--r-space-sm)' }}
                  >
                    Back to search
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Item Edit Bottom Sheet ────────────────────── */}
      {showItemEdit && editingItem && (
        <>
          <div className="r-overlay" onClick={() => setShowItemEdit(null)} />
          <div className="r-bottom-sheet" id="item-edit-sheet">
            <div className="r-bottom-sheet-handle" />
            <div className="r-bottom-sheet-header">
              <h2>{editingItem.name}</h2>
              <button className="r-btn r-btn--icon" onClick={() => setShowItemEdit(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="r-bottom-sheet-body">
              <div className="r-input-group">
                <label className="r-label">Quantity</label>
                <div className="r-qty-control" style={{ width: 'fit-content' }}>
                  <button
                    className="r-qty-btn"
                    onClick={() => updateQuantity(editingItem.item_id, editingItem.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="r-qty-value">{editingItem.quantity}</span>
                  <button
                    className="r-qty-btn"
                    onClick={() => updateQuantity(editingItem.item_id, editingItem.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="r-input-group">
                <label className="r-label">Rate</label>
                <div style={{ fontSize: 'var(--r-text-lg)', fontWeight: 600 }}>
                  ₹{editingItem.rate}
                </div>
              </div>

              <div className="r-input-group">
                <label className="r-label">Discount</label>
                <input
                  type="number"
                  className="r-input"
                  placeholder="0"
                  value={editingItem.discount_amount || ''}
                  onChange={(e) => {
                    const disc = parseFloat(e.target.value) || 0;
                    useBillStore.getState().updateDiscount(editingItem.item_id, disc);
                  }}
                />
              </div>

              <button
                className="r-btn r-btn--danger-ghost r-btn--full"
                onClick={() => {
                  removeItem(editingItem.item_id);
                  setShowItemEdit(null);
                }}
                style={{ marginTop: 'var(--r-space-md)' }}
              >
                <Trash2 size={16} />
                Remove Item
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RetailNewBill;
