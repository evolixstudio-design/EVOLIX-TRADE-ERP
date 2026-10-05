import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';

export default function PurchaseInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeCompanyId = useAuthStore((s: any) => s.activeCompanyId);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const companyId = activeCompanyId || '00000000-0000-0000-0000-000000000000';
        const res = await api.get(`/purchase/invoices?company_id=${companyId}`);
        setInvoices(res.data || []);
      } catch (e) {
        console.error(e);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [activeCompanyId]);

  const filteredInvoices = invoices.filter(inv => 
    inv.document_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.party?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchase Invoices</h1>
          <div className="text-muted text-sm">Manage supplier invoices and payables</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/purchasing/invoices/new')}>
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search Invoices..."
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-6 text-muted">Loading...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-muted">No invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="cursor-pointer">
                    <td className="font-semibold text-primary">{inv.document_number}</td>
                    <td>{inv.party?.name || 'Unknown Supplier'}</td>
                    <td>{new Date(inv.document_date).toLocaleDateString()}</td>
                    <td><span className="badge badge-primary">{inv.status}</span></td>
                    <td className="text-right font-bold">{Number(inv.grand_total).toLocaleString()} KWD</td>
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

