/**
 * EVOLIX Retail V1 — Home Screen
 * 
 * "Tell the owner how the shop is doing today."
 * Greeting + Today's Sales card + Quick Actions + Business Cards
 */
import { useNavigate } from 'react-router-dom';
import {
  Plus, Package, ShoppingCart,
  AlertTriangle, Wallet, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../shared/store/authStore';
import { dashboardApi } from './retailApi';
import { useState, useEffect } from 'react';

const RetailHome = () => {
  const user = useAuthStore((s) => s.user);
  const tenantContext = useAuthStore((s) => s.tenantContext);
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getDashboard();
        setDashboard(res.data || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, []);

  const todaySalesTotal = dashboard?.today_sales || 0;

  const businessCards = [
    { label: 'Supplier Due', value: `₹${(dashboard?.supplier_due || 0).toLocaleString('en-IN')}`, icon: Wallet, color: '--r-warning' },
    { label: 'Customer Due', value: `₹${(dashboard?.customer_due || 0).toLocaleString('en-IN')}`, icon: Wallet, color: '--r-warning' },
    { label: 'Low Stock', value: `${dashboard?.low_stock_count || 0} items`, icon: AlertTriangle, color: '--r-danger' },
    { label: 'Needs Pending', value: `${dashboard?.needs_pending || 0} items`, icon: ShoppingCart, color: '--r-info' },
  ];

  return (
    <>
      {/* Greeting */}
      <div className="r-greeting">
        <div className="r-greeting-text">{getGreeting()} 👋</div>
        <div className="r-greeting-name">
          {tenantContext?.company_name || user?.display_name || 'My Shop'}
        </div>
      </div>

      {/* Today's Sales — Primary Card */}
      <div className="r-section">
        <div className="r-card r-card--primary" id="today-sales-card">
          <div className="r-card-title">Today's Sales</div>
          <div className="r-card-value">₹{todaySalesTotal.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="r-quick-actions" id="quick-actions">
        <button className="r-quick-action" onClick={() => navigate('/retail/bill')} id="qa-new-bill">
          <div className="r-quick-action-icon r-quick-action-icon--green">
            <Plus size={20} />
          </div>
          <span>New Bill</span>
        </button>

        <button className="r-quick-action" onClick={() => navigate('/retail/expenses/add')} id="qa-add-expense">
          <div className="r-quick-action-icon r-quick-action-icon--orange">
            <Wallet size={20} />
          </div>
          <span>Add Expense</span>
        </button>

        <button className="r-quick-action" onClick={() => navigate('/retail/needs')} id="qa-need-list">
          <div className="r-quick-action-icon r-quick-action-icon--blue">
            <Package size={20} />
          </div>
          <span>Need List</span>
        </button>

        <button className="r-quick-action" onClick={() => navigate('/retail/purchases/new')} id="qa-add-purchase">
          <div className="r-quick-action-icon r-quick-action-icon--purple">
            <ShoppingCart size={20} />
          </div>
          <span>Purchase</span>
        </button>
      </div>

      {/* Business Cards */}
      <div className="r-biz-grid" id="business-cards">
        {businessCards.map((card) => (
          <div className="r-biz-card" key={card.label}>
            <div className="r-biz-card-label">
              <card.icon size={14} />
              {card.label}
            </div>
            <div className="r-biz-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* View Today's Summary */}
      <div className="r-section">
        <button
          className="r-btn r-btn--outline r-btn--full"
          onClick={() => navigate('/retail/more/reports')}
          id="view-summary"
        >
          <TrendingUp size={18} />
          View Today's Summary
        </button>
      </div>
    </>
  );
};

export default RetailHome;
