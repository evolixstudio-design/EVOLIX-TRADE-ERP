import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { needListApi, type RetailNeed } from './retailApi';
import api from '../shared/api';
import { AttachmentPicker } from '../shared/components/AttachmentPicker';
import './retail.css';

export default function RetailNeeds() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState<RetailNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, NEED, ORDERED, RECEIVED

  // Add sheet state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [needFile, setNeedFile] = useState<File | null>(null);

  useEffect(() => {
    loadNeeds();
  }, []);

  const loadNeeds = async () => {
    try {
      setLoading(true);
      const res = await needListApi.getNeeds();
      setNeeds(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newQty <= 0) return;
    try {
      setAdding(true);
      const res = await needListApi.createNeed({
        name: newName,
        quantity: newQty,
        priority: 'NORMAL'
      });
      
      const needId = res.data.data.id;

      if (needFile && needId) {
        try {
          const formData = new FormData();
          formData.append('file', needFile);
          formData.append('entityType', 'NEED');
          formData.append('entityId', needId);
          formData.append('category', 'NEED_PHOTO');

          await api.post('/api/v1/attachments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (uploadErr) {
          console.error(uploadErr);
          // Non-blocking error
        }
      }

      setShowAdd(false);
      setNewName('');
      setNewQty(1);
      setNeedFile(null);
      loadNeeds();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await needListApi.updateNeedStatus(id, status);
      loadNeeds();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = needs.filter(n => filter === 'ALL' || n.status === filter);

  return (
    <div className="retail-page">
      <div className="retail-header">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2>Need List <span style={{fontSize: '0.8em', color: '#666'}}>(Mangwana Hai)</span></h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="retail-filters" style={{ padding: '0 16px', marginTop: '16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {['ALL', 'NEED', 'ORDERED', 'RECEIVED'].map(f => (
          <button 
            key={f} 
            className={`pill-button ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="retail-content">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No items in Need List</p>
          </div>
        ) : (
          <div className="item-list">
            {filtered.map(need => (
              <div key={need.id} className="item-card">
                <div className="item-info">
                  <div className="item-name">{need.name}</div>
                  <div className="item-meta">
                    Qty: {need.quantity} • Status: {need.status}
                    {need.customer && ` • For: ${need.customer.name}`}
                  </div>
                </div>
                {need.status === 'NEED' && (
                  <button className="retail-button outline small" onClick={() => updateStatus(need.id, 'ORDERED')}>
                    Order
                  </button>
                )}
                {need.status === 'ORDERED' && (
                  <button className="retail-button small" onClick={() => updateStatus(need.id, 'RECEIVED')}>
                    Receive
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="bottom-sheet-overlay" onClick={() => setShowAdd(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>Add to Need List</h3>
              <button className="icon-button" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} className="sheet-content">
              <div className="form-group">
                <label>What do you need?</label>
                <input 
                  type="text" 
                  className="retail-input" 
                  placeholder="e.g. Dairy Milk Silk"
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  className="retail-input" 
                  value={newQty} 
                  onChange={e => setNewQty(Number(e.target.value))} 
                />
              </div>
              <div className="form-group">
                <label>Photo (Optional)</label>
                <AttachmentPicker 
                  onFileSelect={(f) => setNeedFile(f)}
                />
              </div>
              <button type="submit" className="retail-button primary" disabled={adding || !newName}>
                {adding ? 'Adding...' : 'ADD TO NEED LIST'}
              </button>
            </form>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>
    </div>
  );
}
