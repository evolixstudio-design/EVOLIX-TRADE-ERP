import { useEffect, useState } from 'react';
import { useAuthStore } from '../shared/store/authStore';
import {
  ShoppingCart, Package, FileText,
  Clock, BarChart3
} from 'lucide-react';
import api from '../shared/api';

interface DashboardMetrics {
  salesOrders: number;
  purchaseOrders: number;
  totalItems: number;
  stockMovements: number;
  recentSalesOrders: any[];
  recentPurchaseOrders: any[];
}

const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const tenantContext = useAuthStore(state => state.tenantContext);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    salesOrders: 0,
    purchaseOrders: 0,
    totalItems: 0,
    stockMovements: 0,
    recentSalesOrders: [],
    recentPurchaseOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch real data from existing endpoints
        const [salesRes, purchaseRes] = await Promise.allSettled([
          api.get('/sales/orders'),
          api.get('/purchasing/orders'),
        ]);

        const salesOrders = salesRes.status === 'fulfilled' ? salesRes.value.data : [];
        const purchaseOrders = purchaseRes.status === 'fulfilled' ? purchaseRes.value.data : [];

        setMetrics({
          salesOrders: Array.isArray(salesOrders) ? salesOrders.length : 0,
          purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders.length : 0,
          totalItems: 0,
          stockMovements: 0,
          recentSalesOrders: Array.isArray(salesOrders) ? salesOrders.slice(0, 5) : [],
          recentPurchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders.slice(0, 5) : [],
        });
      } catch (err) {
        console.error('Dashboard metrics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [tenantContext?.company_id]);

  const kpis = [
    {
      label: 'Sales Orders',
      value: metrics.salesOrders,
      icon: ShoppingCart,
      accent: 'accent-primary',
      description: 'Total sales orders',
    },
    {
      label: 'Purchase Orders',
      value: metrics.purchaseOrders,
      icon: FileText,
      accent: 'accent-info',
      description: 'Total purchase orders',
    },
    {
      label: 'Stock Items',
      value: metrics.totalItems,
      icon: Package,
      accent: 'accent-success',
      description: 'Tracked inventory items',
    },
    {
      label: 'Stock Movements',
      value: metrics.stockMovements,
      icon: BarChart3,
      accent: 'accent-warning',
      description: 'Recorded movements',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.display_name || user?.username}</strong>
            {tenantContext?.company_name && (
              <> · {tenantContext.company_name}</>
            )}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`kpi-card ${kpi.accent}`}>
            <div className="kpi-header">
              <kpi.icon size={20} className="kpi-icon" />
              <span className="kpi-label">{kpi.label}</span>
            </div>
            <span className="kpi-value">
              {loading ? '—' : kpi.value.toLocaleString()}
            </span>
            <span className="kpi-description">{kpi.description}</span>
          </div>
        ))}
      </div>

      {/* Activity Grid */}
      <div className="dashboard-grid">
        {/* Recent Sales Orders */}
        <div className="card">
          <div className="card-title">
            <ShoppingCart size={18} />
            Recent Sales Orders
          </div>
          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : metrics.recentSalesOrders.length === 0 ? (
            <div className="empty-state">
              <Clock size={24} className="text-muted" />
              <p className="text-muted">No sales orders yet</p>
            </div>
          ) : (
            <div className="activity-list">
              {metrics.recentSalesOrders.map((so: any) => (
                <div key={so.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-number">{so.document_number}</span>
                    <span className="activity-party">{so.party?.name || '—'}</span>
                  </div>
                  <span className={`badge badge-${so.status === 'POSTED' ? 'success' : so.status === 'DRAFT' ? 'warning' : 'primary'}`}>
                    {so.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Orders */}
        <div className="card">
          <div className="card-title">
            <FileText size={18} />
            Recent Purchase Orders
          </div>
          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : metrics.recentPurchaseOrders.length === 0 ? (
            <div className="empty-state">
              <Clock size={24} className="text-muted" />
              <p className="text-muted">No purchase orders yet</p>
            </div>
          ) : (
            <div className="activity-list">
              {metrics.recentPurchaseOrders.map((po: any) => (
                <div key={po.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-number">{po.document_number}</span>
                    <span className="activity-party">{po.party?.name || '—'}</span>
                  </div>
                  <span className={`badge badge-${po.status === 'POSTED' ? 'success' : po.status === 'DRAFT' ? 'warning' : 'primary'}`}>
                    {po.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

