/**
 * EVOLIX Retail V1 — Items Screen
 * 
 * Item list with search, filters (All / Low Stock / Out of Stock),
 * and + Add Item button.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Package, Camera } from 'lucide-react';
import { itemApi, type RetailItem } from './retailApi';

type StockFilter = 'all' | 'low' | 'out';

const RetailItems = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [allItems, setAllItems] = useState<RetailItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await itemApi.getItems();
        setAllItems(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchItems();
  }, []);

  const filteredItems = allItems.filter((item) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) &&
          !item.sku.toLowerCase().includes(q) &&
          !(item.barcode && item.barcode.includes(q))) {
        return false;
      }
    }

    // Stock filter
    if (filter === 'low') return item.current_stock > 0 && item.current_stock <= (item.low_stock_threshold || 10);
    if (filter === 'out') return item.current_stock <= 0;
    return true;
  });

  const lowStockCount = allItems.filter((i) => i.current_stock > 0 && i.current_stock <= (i.low_stock_threshold || 10)).length;
  const outOfStockCount = allItems.filter((i) => i.current_stock <= 0).length;

  const getStockBadge = (item: RetailItem) => {
    if (item.current_stock <= 0) return <span className="r-badge r-badge--danger">Out of stock</span>;
    if (item.current_stock <= (item.low_stock_threshold || 10)) return <span className="r-badge r-badge--warning">Low stock</span>;
    return null;
  };

  return (
    <>
      {/* Header */}
      <div className="r-page-header">
        <h1>Items</h1>
        <button
          className="r-btn r-btn--primary r-btn--sm"
          onClick={() => navigate('/retail/items/add')}
          id="add-item-btn"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Search */}
      <div className="r-search-bar">
        <span className="r-search-icon"><Search size={20} /></span>
        <input
          type="text"
          placeholder="Search product / barcode"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="item-search"
        />
        <button className="r-search-action">
          <Camera size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="r-chips">
        <button
          className={`r-chip ${filter === 'all' ? 'r-chip--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({allItems.length})
        </button>
        <button
          className={`r-chip ${filter === 'low' ? 'r-chip--active' : ''}`}
          onClick={() => setFilter('low')}
        >
          Low Stock ({lowStockCount})
        </button>
        <button
          className={`r-chip ${filter === 'out' ? 'r-chip--active' : ''}`}
          onClick={() => setFilter('out')}
        >
          Out of Stock ({outOfStockCount})
        </button>
      </div>

      {/* Stock overview mini cards */}
      <div style={{ display: 'flex', gap: 'var(--r-space-sm)', padding: '0 var(--r-space-base)', marginBottom: 'var(--r-space-md)' }}>
        <div className="r-card" style={{ flex: 1, padding: 'var(--r-space-sm) var(--r-space-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--r-text-xs)', color: 'var(--r-text-muted)' }}>Total</div>
          <div style={{ fontSize: 'var(--r-text-lg)', fontWeight: 700 }}>{allItems.length}</div>
        </div>
        <div className="r-card" style={{ flex: 1, padding: 'var(--r-space-sm) var(--r-space-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--r-text-xs)', color: 'var(--r-warning)' }}>Low</div>
          <div style={{ fontSize: 'var(--r-text-lg)', fontWeight: 700, color: 'var(--r-warning)' }}>{lowStockCount}</div>
        </div>
        <div className="r-card" style={{ flex: 1, padding: 'var(--r-space-sm) var(--r-space-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--r-text-xs)', color: 'var(--r-danger)' }}>Out</div>
          <div style={{ fontSize: 'var(--r-text-lg)', fontWeight: 700, color: 'var(--r-danger)' }}>{outOfStockCount}</div>
        </div>
      </div>

      {/* Item List */}
      <div className="r-section">
        {filteredItems.length === 0 ? (
          <div className="r-empty">
            <Package size={48} />
            <p>{searchQuery ? `No items found for "${searchQuery}"` : 'No items in this category'}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="r-list-item"
              onClick={() => {/* navigate to item detail */ }}
              id={`item-${item.id}`}
            >
              <div className="r-list-item-left">
                <div className="r-list-item-title">
                  {item.name}
                  {getStockBadge(item) && (
                    <span style={{ marginLeft: 'var(--r-space-sm)' }}>
                      {getStockBadge(item)}
                    </span>
                  )}
                </div>
                <div className="r-list-item-subtitle">
                  {item.sku} · Stock: {item.current_stock} {item.unit}
                </div>
              </div>
              <div className="r-list-item-right">
                <div className="r-list-item-amount">₹{item.selling_price}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default RetailItems;
