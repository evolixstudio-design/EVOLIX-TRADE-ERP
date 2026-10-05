import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierApi, type RetailSupplier } from './retailApi';
import './retail.css';

export default function RetailSuppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<RetailSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      loadSuppliers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierApi.getSuppliers(search);
      setSuppliers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setAdding(true);
      await supplierApi.createSupplier({
        name: newName,
        mobile: newPhone || undefined
      });
      setShowAdd(false);
      setNewName('');
      setNewPhone('');
      loadSuppliers();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="retail-page">
      <div className="retail-header search-header">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search Supplier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="retail-content">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <p>No suppliers found</p>
          </div>
        ) : (
          <div className="item-list">
            {suppliers.map(sup => (
              <div key={sup.id} className="item-card" onClick={() => navigate(`/retail/suppliers/${sup.id}`)}>
                <div className="item-info">
                  <div className="item-name">{sup.name}</div>
                  <div className="item-meta">{sup.mobile || 'No phone'}</div>
                </div>
                <div className="item-price" style={{ color: sup.outstanding_amount > 0 ? '#d9534f' : '#666', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>You Have to Pay</div>
                  ₹{Math.abs(sup.outstanding_amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="bottom-sheet-overlay" onClick={() => setShowAdd(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>Add Supplier</h3>
              <button className="icon-button" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} className="sheet-content">
              <div className="form-group">
                <label>Supplier Name*</label>
                <input 
                  type="text" 
                  className="retail-input" 
                  placeholder="e.g. ABC Distributors"
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  className="retail-input" 
                  value={newPhone} 
                  onChange={e => setNewPhone(e.target.value)} 
                />
              </div>
              <button type="submit" className="retail-button primary" disabled={adding || !newName}>
                {adding ? 'Saving...' : 'SAVE SUPPLIER'}
              </button>
            </form>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setShowAdd(true)}>+</button>
    </div>
  );
}
