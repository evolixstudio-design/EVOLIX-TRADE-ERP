import { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Calculator,
  Layers,
  Users,
  Gift,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../shared/api';

export default function PricingSchemes() {
  const [activeTab, setActiveTab] = useState<'price-lists' | 'customer-rates' | 'schemes' | 'preview'>('price-lists');

  // Price Lists state
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [selectedPriceList, setSelectedPriceList] = useState<any>(null);
  const [showNewPlModal, setShowNewPlModal] = useState(false);
  const [showNewPlItemModal, setShowNewPlItemModal] = useState(false);

  // New Price List form
  const [newPlCode, setNewPlCode] = useState('');
  const [newPlName, setNewPlName] = useState('');
  const [newPlPriority, setNewPlPriority] = useState(0);
  const [newPlCustomerType, setNewPlCustomerType] = useState('');

  // New Price List Item form
  const [newItemId, setNewItemId] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [newItemMinQty, setNewItemMinQty] = useState('0');
  const [newItemMaxQty, setNewItemMaxQty] = useState('');
  const [newItemDiscount, setNewItemDiscount] = useState('0');

  // Customer Rates state
  const [customerRates, setCustomerRates] = useState<any[]>([]);
  const [showNewCustRateModal, setShowNewCustRateModal] = useState(false);
  const [newCrPartyId, setNewCrPartyId] = useState('');
  const [newCrItemId, setNewCrItemId] = useState('');
  const [newCrRate, setNewCrRate] = useState('');
  const [newCrMinQty, setNewCrMinQty] = useState('0');
  const [newCrMaxQty, setNewCrMaxQty] = useState('');

  // Promotional Schemes state
  const [schemes, setSchemes] = useState<any[]>([]);
  const [showNewSchemeModal, setShowNewSchemeModal] = useState(false);
  const [newSchemeCode, setNewSchemeCode] = useState('');
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeType, setNewSchemeType] = useState('BUY_X_GET_Y');
  const [newSchemeBuyQty, setNewSchemeBuyQty] = useState('10');
  const [newSchemeGetQty, setNewSchemeGetQty] = useState('1');
  const [newSchemePriority, setNewSchemePriority] = useState(0);
  const [newSchemeStackable, setNewSchemeStackable] = useState(false);

  // Simulation & Preview state
  const [simPartyId, setSimPartyId] = useState('');
  const [simItemId, setSimItemId] = useState('');
  const [simQuantity, setSimQuantity] = useState('1');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // General Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchPriceLists();
    fetchCustomerRates();
    fetchSchemes();
  }, []);

  const fetchPriceLists = async () => {
    try {
      const res = await api.get('/api/v1/pricing/price-lists');
      setPriceLists(res.data || []);
      if (res.data?.length > 0 && !selectedPriceList) {
        setSelectedPriceList(res.data[0]);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchCustomerRates = async () => {
    try {
      const res = await api.get('/api/v1/pricing/customer-rates');
      setCustomerRates(res.data || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/api/v1/pricing/schemes');
      setSchemes(res.data || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreatePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/api/v1/pricing/price-lists', {
        code: newPlCode.trim(),
        name: newPlName.trim(),
        priority: Number(newPlPriority) || 0,
        customer_type: newPlCustomerType || undefined,
      });
      setSuccessMsg(`Price List "${res.data.name}" created successfully`);
      setShowNewPlModal(false);
      setNewPlCode('');
      setNewPlName('');
      fetchPriceLists();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to create price list');
    }
  };

  const handleAddPriceListItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceList) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post(`/api/v1/pricing/price-lists/${selectedPriceList.id}/items`, {
        item_id: newItemId,
        rate: Number(newItemRate),
        min_qty: Number(newItemMinQty) || 0,
        max_qty: newItemMaxQty ? Number(newItemMaxQty) : undefined,
        discount_percent: Number(newItemDiscount) || 0,
      });
      setSuccessMsg('Price list rate/slab added successfully');
      setShowNewPlItemModal(false);
      setNewItemId('');
      setNewItemRate('');
      setNewItemMinQty('0');
      setNewItemMaxQty('');
      // Refresh current price list
      const updated = await api.get(`/api/v1/pricing/price-lists/${selectedPriceList.id}`);
      setSelectedPriceList(updated.data);
      fetchPriceLists();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to add item slab');
    }
  };

  const handleCreateCustomerRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/v1/pricing/customer-rates', {
        party_id: newCrPartyId,
        item_id: newCrItemId,
        rate: Number(newCrRate),
        min_qty: Number(newCrMinQty) || 0,
        max_qty: newCrMaxQty ? Number(newCrMaxQty) : undefined,
      });
      setSuccessMsg('Customer-specific rate configured');
      setShowNewCustRateModal(false);
      setNewCrRate('');
      fetchCustomerRates();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to create customer rate');
    }
  };

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/v1/pricing/schemes', {
        code: newSchemeCode.trim(),
        name: newSchemeName.trim(),
        scheme_type: newSchemeType,
        buy_quantity: Number(newSchemeBuyQty) || undefined,
        get_quantity: Number(newSchemeGetQty) || undefined,
        priority: Number(newSchemePriority) || 0,
        stackable: newSchemeStackable,
      });
      setSuccessMsg('Promotional scheme created successfully');
      setShowNewSchemeModal(false);
      setNewSchemeCode('');
      setNewSchemeName('');
      fetchSchemes();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to create promotional scheme');
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simItemId) {
      setErrorMsg('Please enter or select an Item ID');
      return;
    }
    setErrorMsg('');
    setSimLoading(true);
    try {
      const res = await api.post('/api/v1/pricing/evaluate', {
        party_id: simPartyId || undefined,
        lines: [
          {
            item_id: simItemId,
            quantity: Number(simQuantity) || 1,
          },
        ],
      });
      setSimResult(res.data);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to evaluate pricing');
      setSimResult(null);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag size={28} color="#2563eb" /> Pricing & Schemes Engine
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Module 13 authoritative price lists, customer rates, quantity slabs, BXGY schemes & applied rule trace
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowNewPlModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Price List
          </button>
          <button
            onClick={() => setShowNewSchemeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Gift size={16} /> New Scheme
          </button>
        </div>
      </div>

      {/* ── Status Alerts ──────────────────────────────────── */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        {[
          { id: 'price-lists', label: 'Price Lists & Slabs', icon: Layers },
          { id: 'customer-rates', label: 'Customer Overrides', icon: Users },
          { id: 'schemes', label: 'Buy X Get Y & Promotions', icon: Gift },
          { id: 'preview', label: 'Price Engine & Rule Trace Preview', icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Price Lists & Slabs ─────────────────────── */}
      {activeTab === 'price-lists' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Price Lists Sidebar */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Price Lists</h3>
            {priceLists.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No price lists created yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {priceLists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPriceList(pl)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedPriceList?.id === pl.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: selectedPriceList?.id === pl.id ? '#eff6ff' : '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{pl.name}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: pl.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: pl.status === 'ACTIVE' ? '#166534' : '#991b1b', fontWeight: '600' }}>
                        {pl.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Code: {pl.code}</span>
                      <span>Priority: {pl.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Price List Detail */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
            {selectedPriceList ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{selectedPriceList.name}</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                      Code: {selectedPriceList.code} | Currency: {selectedPriceList.currency} | Priority: {selectedPriceList.priority} | Customer Scope: {selectedPriceList.customer_type || 'ALL'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewPlItemModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} /> Add Item Slab Rate
                  </button>
                </div>

                {/* Slabs Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Item ID / SKU</th>
                      <th style={{ padding: '10px 12px' }}>Min Qty (Slab)</th>
                      <th style={{ padding: '10px 12px' }}>Max Qty</th>
                      <th style={{ padding: '10px 12px' }}>Authoritative Rate</th>
                      <th style={{ padding: '10px 12px' }}>Discount %</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedPriceList.items || selectedPriceList.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          No items or quantity slabs configured in this price list.
                        </td>
                      </tr>
                    ) : (
                      selectedPriceList.items.map((pli: any) => (
                        <tr key={pli.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>{pli.item?.name || pli.item_id}</td>
                          <td style={{ padding: '12px' }}>{pli.min_qty}</td>
                          <td style={{ padding: '12px' }}>{pli.max_qty ?? '∞'}</td>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>₹{Number(pli.rate).toFixed(2)}</td>
                          <td style={{ padding: '12px' }}>{Number(pli.discount_percent || 0)}%</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '600' }}>
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Select a price list from the sidebar.</div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Customer-Specific Rates ─────────────────── */}
      {activeTab === 'customer-rates' && (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Customer-Specific Rate Overrides</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Highest precedence pricing overrides assigned directly to specific customer parties</p>
            </div>
            <button
              onClick={() => setShowNewCustRateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add Customer Rate
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px' }}>Customer / Party</th>
                <th style={{ padding: '10px 12px' }}>Item</th>
                <th style={{ padding: '10px 12px' }}>Min Qty</th>
                <th style={{ padding: '10px 12px' }}>Max Qty</th>
                <th style={{ padding: '10px 12px' }}>Override Rate</th>
                <th style={{ padding: '10px 12px' }}>Validity</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {customerRates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No customer-specific rate overrides configured.
                  </td>
                </tr>
              ) : (
                customerRates.map((cr) => (
                  <tr key={cr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{cr.party?.name || cr.party_id}</td>
                    <td style={{ padding: '12px' }}>{cr.item?.name || cr.item_id}</td>
                    <td style={{ padding: '12px' }}>{cr.min_qty}</td>
                    <td style={{ padding: '12px' }}>{cr.max_qty ?? '∞'}</td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#059669' }}>₹{Number(cr.rate).toFixed(2)}</td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
                      {cr.valid_from ? new Date(cr.valid_from).toLocaleDateString() : 'Always'} – {cr.valid_to ? new Date(cr.valid_to).toLocaleDateString() : 'Always'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '600' }}>
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 3: Promotional Schemes ───────────────────────── */}
      {activeTab === 'schemes' && (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Promotional Schemes & Benefits</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Buy X Get Y, Free Quantity, Promotional Item Discounts, and Order Bill Discounts</p>
            </div>
            <button
              onClick={() => setShowNewSchemeModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Create Scheme
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px' }}>Code</th>
                <th style={{ padding: '10px 12px' }}>Scheme Name</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Rule Benefit</th>
                <th style={{ padding: '10px 12px' }}>Priority</th>
                <th style={{ padding: '10px 12px' }}>Stackable</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {schemes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No promotional schemes configured.
                  </td>
                </tr>
              ) : (
                schemes.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#2563eb' }}>{s.code}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{s.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: '600' }}>
                        {s.scheme_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#0f172a' }}>
                      {s.scheme_type === 'BUY_X_GET_Y'
                        ? `Buy ${s.buy_quantity} → Get ${s.get_quantity} Free`
                        : s.scheme_type === 'FREE_QUANTITY'
                        ? `Free ${s.get_quantity} on ${s.buy_quantity}`
                        : s.discount_percent
                        ? `${s.discount_percent}% Off`
                        : `₹${s.discount_amount} Off`}
                    </td>
                    <td style={{ padding: '12px' }}>{s.priority}</td>
                    <td style={{ padding: '12px' }}>{s.stackable ? 'Yes' : 'No (Exclusive)'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: s.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: s.status === 'ACTIVE' ? '#166534' : '#991b1b', fontWeight: '600' }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 4: Price Engine & Rule Trace Preview ───────── */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
          {/* Simulation Input Panel */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} color="#2563eb" /> Price Engine Simulator
            </h3>
            <form onSubmit={handleSimulate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Item ID *</label>
                <input
                  type="text"
                  value={simItemId}
                  onChange={(e) => setSimItemId(e.target.value)}
                  placeholder="Paste Item UUID"
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Customer Party ID (Optional)</label>
                <input
                  type="text"
                  value={simPartyId}
                  onChange={(e) => setSimPartyId(e.target.value)}
                  placeholder="Paste Customer UUID"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Quantity</label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={simQuantity}
                  onChange={(e) => setSimQuantity(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={simLoading}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {simLoading ? 'Evaluating Rules...' : 'Calculate Authoritative Price'}
              </button>
            </form>
          </div>

          {/* Trace Results & Inspection */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#059669" /> Applied Rule Trace (Immutable ERP Decision)
            </h3>

            {!simResult ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                Run simulation to inspect authoritative pricing resolution, slabs, and exact rule lineage.
              </div>
            ) : (
              <div>
                {/* Result KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Resolved Base Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                      ₹{Number(simResult.lines[0]?.resolvedRate || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '12px', color: '#166534' }}>Free Quantity (Scheme)</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#15803d', marginTop: '4px' }}>
                      +{Number(simResult.lines[0]?.freeQuantity || 0)} Units
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '12px', color: '#92400e' }}>Applied Discount</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#b45309', marginTop: '4px' }}>
                      ₹{Number(simResult.lines[0]?.discountAmount || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af' }}>Final Line Total</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1d4ed8', marginTop: '4px' }}>
                      ₹{Number(simResult.lines[0]?.lineTotal || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Applied Lineage Timeline */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Step-by-Step Rule Lineage:</h4>
                <div style={{ borderLeft: '2px solid #cbd5e1', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {simResult.lines[0]?.ruleDetails?.map((rd: any, idx: number) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{rd.step}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{rd.description}</div>
                      {rd.adjustedValue && (
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: '500', marginTop: '2px' }}>
                          Rate: ₹{rd.adjustedValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Raw Immutable Trace JSON */}
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  Raw Applied Trace Snapshot (Stored with transaction line):
                </h4>
                <pre
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    overflowX: 'auto',
                    margin: 0,
                  }}
                >
                  {JSON.stringify(simResult.lines[0]?.pricingTrace, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: New Price List ──────────────────────────── */}
      {showNewPlModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '440px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Create Price List</h3>
            <form onSubmit={handleCreatePriceList}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Code *</label>
                <input type="text" value={newPlCode} onChange={(e) => setNewPlCode(e.target.value)} required placeholder="e.g. WHOLESALE-2026" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Name *</label>
                <input type="text" value={newPlName} onChange={(e) => setNewPlName(e.target.value)} required placeholder="e.g. Standard Wholesale" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Priority (Higher = Evaluated first)</label>
                <input type="number" value={newPlPriority} onChange={(e) => setNewPlPriority(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Customer Type Scope</label>
                <input type="text" value={newPlCustomerType} onChange={(e) => setNewPlCustomerType(e.target.value)} placeholder="e.g. WHOLESALE, RETAIL (blank = all)" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNewPlModal(false)} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Price List Item Slab ────────────────── */}
      {showNewPlItemModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '440px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Add Item Rate / Slab to {selectedPriceList?.name}</h3>
            <form onSubmit={handleAddPriceListItem}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Item ID *</label>
                <input type="text" value={newItemId} onChange={(e) => setNewItemId(e.target.value)} required placeholder="Item UUID" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Authoritative Rate (₹) *</label>
                <input type="number" step="any" min="0" value={newItemRate} onChange={(e) => setNewItemRate(e.target.value)} required placeholder="0.00" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Min Qty</label>
                  <input type="number" min="0" value={newItemMinQty} onChange={(e) => setNewItemMinQty(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Max Qty (Blank = ∞)</label>
                  <input type="number" min="0" value={newItemMaxQty} onChange={(e) => setNewItemMaxQty(e.target.value)} placeholder="∞" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Discount % (Optional)</label>
                <input type="number" min="0" max="100" value={newItemDiscount} onChange={(e) => setNewItemDiscount(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNewPlItemModal(false)} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Slab</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Customer Rate ───────────────────────── */}
      {showNewCustRateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '440px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Configure Customer Override</h3>
            <form onSubmit={handleCreateCustomerRate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Customer Party ID *</label>
                <input type="text" value={newCrPartyId} onChange={(e) => setNewCrPartyId(e.target.value)} required placeholder="Party UUID" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Item ID *</label>
                <input type="text" value={newCrItemId} onChange={(e) => setNewCrItemId(e.target.value)} required placeholder="Item UUID" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Override Rate (₹) *</label>
                <input type="number" step="any" min="0" value={newCrRate} onChange={(e) => setNewCrRate(e.target.value)} required placeholder="0.00" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Min Qty</label>
                  <input type="number" min="0" value={newCrMinQty} onChange={(e) => setNewCrMinQty(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Max Qty (Blank = ∞)</label>
                  <input type="number" min="0" value={newCrMaxQty} onChange={(e) => setNewCrMaxQty(e.target.value)} placeholder="∞" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNewCustRateModal(false)} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Create Scheme ───────────────────────────── */}
      {showNewSchemeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '480px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Create Promotional Scheme</h3>
            <form onSubmit={handleCreateScheme}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Code *</label>
                  <input type="text" value={newSchemeCode} onChange={(e) => setNewSchemeCode(e.target.value)} required placeholder="e.g. BXGY-FESTIVE" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Type *</label>
                  <select value={newSchemeType} onChange={(e) => setNewSchemeType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="BUY_X_GET_Y">Buy X Get Y (BXGY)</option>
                    <option value="FREE_QUANTITY">Free Quantity</option>
                    <option value="ITEM_DISCOUNT">Item Discount</option>
                    <option value="BILL_DISCOUNT">Bill Discount</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Name *</label>
                <input type="text" value={newSchemeName} onChange={(e) => setNewSchemeName(e.target.value)} required placeholder="e.g. Buy 10 Get 1 Free Promo" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              {(newSchemeType === 'BUY_X_GET_Y' || newSchemeType === 'FREE_QUANTITY') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Buy / Qualifying Qty *</label>
                    <input type="number" min="1" value={newSchemeBuyQty} onChange={(e) => setNewSchemeBuyQty(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Get Free Qty *</label>
                    <input type="number" min="1" value={newSchemeGetQty} onChange={(e) => setNewSchemeGetQty(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Priority (Higher wins)</label>
                  <input type="number" value={newSchemePriority} onChange={(e) => setNewSchemePriority(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newSchemeStackable} onChange={(e) => setNewSchemeStackable(e.target.checked)} />
                    Stackable Scheme
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNewSchemeModal(false)} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Create Scheme</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

