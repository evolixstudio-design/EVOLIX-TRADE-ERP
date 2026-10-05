import { useState, useEffect } from 'react';
import { ShoppingCart, PackageOpen, FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';

export default function SalesDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const activeCompanyId = useAuthStore((s: any) => s.activeCompanyId); // Assuming active company logic exists

  useEffect(() => {
    // For demo pursoses, fetch from the newly created backend API
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Assuming company ID is hardcoded for demo if not selected
        const companyId = activeCompanyId || '00000000-0000-0000-0000-000000000000';
        const res = await api.get(`/sales/dashboard?company_id=${companyId}`);
        setData(res.data);
      } catch (e) {
        console.error(e);
        // Remove fake fallback data
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [activeCompanyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchasing Dashboard</h1>
          <div className="text-muted text-sm">Overview of your procurement activities</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary">
            <ShoppingCart size={16} /> New Sales Order
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="flex justify-between items-center mb-2">
            <div className="kpi-label">Open Sales Orders</div>
            <ShoppingCart size={20} className="text-primary" />
          </div>
          <div className="kpi-value">{data?.openSOs || 0}</div>
        </div>
        
        <div className="kpi-card">
          <div className="flex justify-between items-center mb-2">
            <div className="kpi-label">Pending Receipts</div>
            <PackageOpen size={20} className="text-warning" />
          </div>
          <div className="kpi-value">{data?.pendingReceipts || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center mb-2">
            <div className="kpi-label">Pending Invoices</div>
            <FileText size={20} className="text-danger" />
          </div>
          <div className="kpi-value">{data?.pendingInvoices || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center mb-2">
            <div className="kpi-label">Total Purchases (KWD)</div>
            <TrendingUp size={20} className="text-success" />
          </div>
          <div className="kpi-value">
            {Number(data?.totalPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h2 className="card-title">Recent Sales Orders</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount (KWD)</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentPurchases?.map((po: any, i: number) => (
                  <tr key={i}>
                    <td className="font-semibold text-primary">{po.document_number}</td>
                    <td>{new Date(po.document_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${po.status === 'FULLY_RECEIVED' ? 'badge-success' : po.status === 'DRAFT' ? 'badge-warning' : 'badge-primary'}`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {Number(po.total).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                    </td>
                  </tr>
                ))}
                {(!data?.recentPurchases || data.recentPurchases.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted p-4">No recent sales orders.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <h2 className="card-title">Action Items</h2>
          <div className="flex gap-3 items-center p-3 rounded border border-warning-light bg-warning-light">
            <AlertCircle size={24} className="text-warning" />
            <div>
              <div className="font-semibold text-warning">2 Payables Overdue</div>
              <div className="text-sm text-muted">Requires immediate attention</div>
            </div>
          </div>
          <div className="flex gap-3 items-center p-3 rounded border border-info-light bg-info-light">
            <Clock size={24} className="text-info" />
            <div>
              <div className="font-semibold text-info">5 Deliveries Expected</div>
              <div className="text-sm text-muted">Expected in the next 3 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

