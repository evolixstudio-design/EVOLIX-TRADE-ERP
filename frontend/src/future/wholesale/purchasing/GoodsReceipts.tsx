import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Printer } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';

export default function GoodsReceipts() {
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeCompanyId = useAuthStore((s: any) => s.activeCompanyId);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGRNs = async () => {
      try {
        setLoading(true);
        const companyId = activeCompanyId || '00000000-0000-0000-0000-000000000000';
        const res = await api.get(`/purchase/receipts?company_id=${companyId}`);
        setGrns(res.data || []);
      } catch (e) {
        console.error(e);
        setGrns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGRNs();
  }, [activeCompanyId]);

  const filteredGRNs = grns.filter(grn => 
    grn.document_number.toLowerCase().includes(search.toLowerCase()) ||
    grn.party?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Goods Receipts (GRN)</h1>
          <div className="text-muted text-sm">Manage goods receipts and stock inflow</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/purchasing/receipts/new')}>
          <Plus size={16} /> Create GRN
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search GRNs..."
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
                <th>GRN Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-6 text-muted">Loading...</td></tr>
              ) : filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-muted">No goods receipts found.</td>
                </tr>
              ) : (
                filteredGRNs.map((grn) => (
                  <tr key={grn.id} className="cursor-pointer">
                    <td className="font-semibold text-primary">{grn.document_number}</td>
                    <td>{grn.party?.name || 'Unknown Supplier'}</td>
                    <td>{new Date(grn.document_date).toLocaleDateString()}</td>
                    <td><span className="badge badge-primary">{grn.status}</span></td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/inventory/barcodes');
                        }}
                        title="Print Barcodes / Labels"
                      >
                        <Printer size={13} /> Labels
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

