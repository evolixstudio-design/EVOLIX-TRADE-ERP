import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';

export default function SalesReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeCompanyId = useAuthStore((s: any) => s.activeCompanyId);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const companyId = activeCompanyId || '00000000-0000-0000-0000-000000000000';
        const res = await api.get(`/sales/returns?company_id=${companyId}`);
        setReturns(res.data || []);
      } catch (e) {
        console.error(e);
        setReturns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, [activeCompanyId]);

  const filteredReturns = returns.filter(ret => 
    ret.document_number.toLowerCase().includes(search.toLowerCase()) ||
    ret.party?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Returns</h1>
          <div className="text-muted text-sm">Manage returns to customers</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sales/returns/new')}>
          <Plus size={16} /> Create Return
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search Returns..."
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
                <th>Return Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-6 text-muted">Loading...</td></tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-muted">No returns found.</td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="cursor-pointer">
                    <td className="font-semibold text-primary">{ret.document_number}</td>
                    <td>{ret.party?.name || 'Unknown Customer'}</td>
                    <td>{new Date(ret.document_date).toLocaleDateString()}</td>
                    <td><span className="badge badge-primary">{ret.status}</span></td>
                    <td className="text-right font-bold">{Number(ret.grand_total).toLocaleString()} KWD</td>
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

