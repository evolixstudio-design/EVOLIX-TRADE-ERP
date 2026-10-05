import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, FileText, CheckCircle2, CircleDashed } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';

export default function PurchaseOrders() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeCompanyId = useAuthStore((s: any) => s.activeCompanyId);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        setLoading(true);
        const companyId = activeCompanyId || '00000000-0000-0000-0000-000000000000';
        const res = await api.get(`/purchase/orders?company_id=${companyId}`);
        setPos(res.data || []);
      } catch (e) {
        console.error(e);
        // Fallback removed
        setPos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPOs();
  }, [activeCompanyId]);

  const filteredPOs = pos.filter(po => 
    po.document_number.toLowerCase().includes(search.toLowerCase()) ||
    po.party?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-warning">Draft</span>;
      case 'CONFIRMED': return <span className="badge badge-primary">Confirmed</span>;
      case 'PARTIALLY_RECEIVED': return <span className="badge badge-warning">Partially Received</span>;
      case 'FULLY_RECEIVED': return <span className="badge badge-success">Fully Received</span>;
      case 'CLOSED': return <span className="badge text-muted">Closed</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'FULLY_RECEIVED') return <CheckCircle2 size={16} className="text-success" />;
    return <CircleDashed size={16} className="text-muted" />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <div className="text-muted text-sm">Manage procurement and track order fulfillment</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/purchasing/orders/new')}>
          <Plus size={16} /> Create Purchase Order
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2" style={{ width: '300px' }}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-muted" size={16} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search POs or Suppliers..."
                style={{ paddingLeft: '2.25rem' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} /> Filters
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Status</th>
                <th>Receiving</th>
                <th className="text-right">Total Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-muted">Loading orders...</td></tr>
              ) : filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} />
                      <div>No purchase orders found.</div>
                      <button className="btn btn-primary mt-2" onClick={() => navigate('/purchasing/orders/new')}>
                        Create your first PO
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr key={po.id} className="cursor-pointer" onClick={() => navigate(`/purchasing/orders/${po.id}`)}>
                    <td className="font-semibold text-primary">{po.document_number}</td>
                    <td>{po.party?.name || 'Unknown Supplier'}</td>
                    <td>{new Date(po.document_date).toLocaleDateString()}</td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(po.status)}
                        <span className="text-sm">
                          {po.status === 'FULLY_RECEIVED' ? 'Complete' : po.status === 'PARTIALLY_RECEIVED' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-bold text-main">
                      {Number(po.total).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} KWD
                    </td>
                    <td className="text-right">
                      <button 
                        className="btn btn-secondary btn-icon"
                        onClick={(e) => { e.stopPropagation(); navigate(`/purchasing/orders/${po.id}`); }}
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

