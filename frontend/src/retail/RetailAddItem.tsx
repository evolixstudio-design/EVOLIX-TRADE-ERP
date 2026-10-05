/**
 * EVOLIX Retail V1 — Quick Add Item
 * 
 * Extremely simple form by default: Item Name, Selling Price, Opening Stock
 * "More Details" expands to advanced fields.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, Check
} from 'lucide-react';

const RetailAddItem = () => {
  const navigate = useNavigate();

  // Default fields
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [openingStock, setOpeningStock] = useState('');

  // Advanced fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [hsn, setHsn] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !sellingPrice) return;

    setSaving(true);

    // Simulate API call — replace with actual POST /api/v1/items
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSaving(false);
    setSaved(true);

    // Show success briefly then navigate back
    setTimeout(() => {
      navigate('/retail/items');
    }, 1000);
  };

  if (saved) {
    return (
      <div className="r-success-screen" style={{ minHeight: '60vh' }}>
        <div className="r-success-icon">
          <Check strokeWidth={3} />
        </div>
        <div style={{ fontSize: 'var(--r-text-xl)', fontWeight: 700, marginBottom: 4 }}>
          Item Saved!
        </div>
        <div style={{ color: 'var(--r-text-muted)' }}>{name}</div>
      </div>
    );
  }

  return (
    <div className="r-page-with-sticky">
      {/* Header */}
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>Add Item</h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="r-section">
        {/* Item Name */}
        <div className="r-input-group">
          <label className="r-label">Item Name *</label>
          <input
            type="text"
            className="r-input"
            placeholder="e.g. Dairy Milk Silk"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            id="item-name-input"
          />
        </div>

        {/* Selling Price */}
        <div className="r-input-group">
          <label className="r-label">Selling Price (₹) *</label>
          <input
            type="number"
            className="r-input r-input--lg"
            placeholder="0"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            id="selling-price-input"
          />
        </div>

        {/* Opening Stock */}
        <div className="r-input-group">
          <label className="r-label">
            Opening Stock
            <span style={{ color: 'var(--r-text-muted)', fontWeight: 400, marginLeft: 4 }}>optional</span>
          </label>
          <input
            type="number"
            className="r-input"
            placeholder="0"
            value={openingStock}
            onChange={(e) => setOpeningStock(e.target.value)}
            id="opening-stock-input"
          />
        </div>

        {/* More Details Toggle */}
        <button
          className={`r-expand-trigger ${showAdvanced ? 'r-expand-trigger--open' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          id="more-details-toggle"
        >
          <ChevronDown size={16} />
          {showAdvanced ? 'Less Details' : 'More Details'}
        </button>

        {/* Advanced Fields */}
        {showAdvanced && (
          <div style={{ animation: 'r-fade-in 0.2s ease' }}>
            <div className="r-input-group">
              <label className="r-label">SKU</label>
              <input
                type="text"
                className="r-input"
                placeholder="Auto-generated if empty"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="r-input-group">
              <label className="r-label">Barcode</label>
              <input
                type="text"
                className="r-input"
                placeholder="Scan or enter barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div className="r-input-group">
              <label className="r-label">Category</label>
              <input
                type="text"
                className="r-input"
                placeholder="e.g. Groceries, Beverages"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="r-input-group">
              <label className="r-label">Unit</label>
              <select
                className="r-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="GM">GM (Grams)</option>
                <option value="LTR">LTR (Litres)</option>
                <option value="ML">ML (Millilitres)</option>
                <option value="MTR">MTR (Metres)</option>
                <option value="BOX">BOX</option>
                <option value="PKT">PKT (Packet)</option>
                <option value="DZ">DZ (Dozen)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--r-space-md)' }}>
              <div className="r-input-group" style={{ flex: 1 }}>
                <label className="r-label">Purchase Price (₹)</label>
                <input
                  type="number"
                  className="r-input"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="r-input-group" style={{ flex: 1 }}>
                <label className="r-label">MRP (₹)</label>
                <input
                  type="number"
                  className="r-input"
                  placeholder="0"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--r-space-md)' }}>
              <div className="r-input-group" style={{ flex: 1 }}>
                <label className="r-label">GST Rate (%)</label>
                <select
                  className="r-select"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                >
                  <option value="">None</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="r-input-group" style={{ flex: 1 }}>
                <label className="r-label">HSN/SAC</label>
                <input
                  type="text"
                  className="r-input"
                  placeholder=""
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                />
              </div>
            </div>

            <div className="r-input-group">
              <label className="r-label">Low Stock Alert</label>
              <input
                type="number"
                className="r-input"
                placeholder="10"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Button */}
      <div className="r-sticky-footer">
        <button
          className="r-btn r-btn--primary-lg"
          onClick={handleSave}
          disabled={!name.trim() || !sellingPrice || saving}
          id="save-item-btn"
        >
          {saving ? 'Saving...' : 'SAVE ITEM'}
        </button>
      </div>
    </div>
  );
};

export default RetailAddItem;
