/**
 * EVOLIX Retail V1 — Khata Screen
 * 
 * Customer credit tracking.
 * Shows total receivable and customer cards with balances.
 * Simple language: "You'll Receive" instead of "Accounts Receivable"
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, BookOpen
} from 'lucide-react';
import { khataApi, type RetailCustomer } from './retailApi';

const RetailKhata = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<RetailCustomer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await khataApi.getCustomers();
        setCustomers(res.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCustomers();
  }, []);

  const customersWithBalance = customers.filter((c) => c.outstanding_amount > 0);
  const totalReceivable = customersWithBalance.reduce((sum, c) => sum + c.outstanding_amount, 0);

  const filtered = searchQuery.trim()
    ? customersWithBalance.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.mobile && c.mobile.includes(searchQuery))
      )
    : customersWithBalance;

  return (
    <>
      {/* Header */}
      <div className="r-page-header">
        <h1>Khata</h1>
        <button
          className="r-btn r-btn--primary r-btn--sm"
          onClick={() => navigate('/retail/customers/add')}
          id="add-customer-btn"
        >
          <Plus size={16} />
          Customer
        </button>
      </div>

      {/* Summary Card */}
      <div className="r-section">
        <div className="r-card r-card--primary" id="khata-summary">
          <div className="r-card-title">Total You'll Receive</div>
          <div className="r-card-value">₹{totalReceivable.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 'var(--r-text-sm)', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {customersWithBalance.length} customers with pending dues
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="r-search-bar">
        <span className="r-search-icon"><Search size={20} /></span>
        <input
          type="text"
          placeholder="Search customer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="khata-search"
        />
      </div>

      {/* Customer List */}
      <div className="r-section">
        {filtered.length === 0 ? (
          <div className="r-empty">
            <BookOpen size={48} />
            <p>{searchQuery ? `No customers found for "${searchQuery}"` : 'No pending dues'}</p>
          </div>
        ) : (
          filtered.map((customer) => (
            <div
              key={customer.id}
              className="r-list-item"
              onClick={() => navigate(`/retail/khata/${customer.id}`)}
              id={`khata-${customer.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--r-space-md)', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--r-primary-light)', color: 'var(--r-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 'var(--r-text-base)', flexShrink: 0,
                }}>
                  {customer.name[0].toUpperCase()}
                </div>
                <div className="r-list-item-left">
                  <div className="r-list-item-title">{customer.name}</div>
                  <div className="r-list-item-subtitle">{customer.mobile || 'No mobile'}</div>
                </div>
              </div>
              <div className="r-list-item-right">
                <div style={{ fontSize: 'var(--r-text-xs)', color: 'var(--r-text-muted)' }}>
                  You'll Receive
                </div>
                <div className="r-list-item-amount" style={{ color: 'var(--r-danger)' }}>
                  ₹{customer.outstanding_amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default RetailKhata;
