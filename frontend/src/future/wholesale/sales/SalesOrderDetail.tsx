import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PackagePlus, FileText, CheckCircle, CreditCard, Box } from 'lucide-react';
import api from '../../shared/api';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSO = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sales/orders/${id}`);
        setPo(res.data);
      } catch (e) {
        console.error(e);
        // Fallback removed per forensic requirements
        setPo(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSO();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-muted">Loading sales order...</div>;
  if (!po) return <div className="p-6 text-center text-danger">Sales Order not found.</div>;

  const calculateProgress = () => {
    let ordered = 0;
    let received = 0;
    po.lines.forEach((l: any) => {
      ordered += Number(l.ordered_quantity);
      received += Number(l.received_quantity);
    });
    return ordered === 0 ? 0 : (received / ordered) * 100;
  };
  const progress = calculateProgress();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <button className="btn btn-secondary btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="mb-0">{po.document_number}</h1>
              <span className={`badge ${po.status === 'FULLY_RECEIVED' ? 'badge-success' : 'badge-warning'}`}>
                {po.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-muted text-sm mt-1">
              Date: {new Date(po.document_date).toLocaleDateString()} | Expected: {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {po.status !== 'FULLY_RECEIVED' && po.status !== 'CLOSED' && po.status !== 'CANCELLED' && (
            <button className="btn btn-primary" onClick={() => navigate(`/sales/challans/new?po_id=${po.id}`)}>
              <PackagePlus size={16} /> Receive Goods
            </button>
          )}
          <button className="btn btn-secondary">
            <CreditCard size={16} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-muted text-sm mb-4 uppercase tracking-wider">Customer Details</h3>
          <div className="font-semibold text-lg">{po.party?.name}</div>
          <div className="text-muted text-sm mt-1">Code: {po.party?.code}</div>
          <div className="text-muted text-sm mt-1">Phone: {po.party?.phone || 'N/A'}</div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-muted text-sm mb-2 uppercase tracking-wider">Warehouse</h3>
            <div>{po.branch?.name || 'Main Branch'}</div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="text-muted text-sm mb-4 uppercase tracking-wider">Fulfillment Progress</h3>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">{Math.round(progress)}% Received</span>
            <span className="text-muted text-sm">
              {po.lines.reduce((sum: number, l: any) => sum + Number(l.received_quantity), 0)} / 
              {po.lines.reduce((sum: number, l: any) => sum + Number(l.ordered_quantity), 0)} Items
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 mb-6">
            <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>

          <h3 className="text-muted text-sm mb-4 uppercase tracking-wider">Related Documents</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 p-2 px-3 border border-border rounded bg-surface hover:bg-surface-hover cursor-pointer transition-colors">
              <FileText size={16} className="text-primary" />
              <span className="font-semibold text-sm">Sales Order</span>
            </div>
            {po.goods_receipts?.map((grn: any) => (
              <div key={grn.document_number} className="flex items-center gap-2 p-2 px-3 border border-border rounded bg-surface hover:bg-surface-hover cursor-pointer transition-colors">
                <Box size={16} className="text-warning" />
                <span className="font-semibold text-sm">{grn.document_number}</span>
                <CheckCircle size={14} className="text-success ml-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-hover flex items-center justify-between">
          <h2 className="mb-0 text-lg">Line Items</h2>
          <div className="text-muted text-sm">3-Way Match Validation Active</div>
        </div>
        <div className="table-container border-0 rounded-none shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Ordered</th>
                <th className="text-right">Received</th>
                <th className="text-right">Pending</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l: any, i: number) => {
                const ordered = Number(l.ordered_quantity);
                const received = Number(l.received_quantity);
                const pending = ordered - received;
                return (
                  <tr key={i}>
                    <td>
                      <div className="font-semibold">{l.item?.name}</div>
                      <div className="text-xs text-muted">SKU: {l.item?.sku}</div>
                    </td>
                    <td className="text-right">{ordered} {l.unit?.name}</td>
                    <td className="text-right">
                      <span className={received < ordered ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                        {received}
                      </span>
                    </td>
                    <td className="text-right text-muted">{pending > 0 ? pending : '-'}</td>
                    <td className="text-right">{Number(l.rate).toLocaleString(undefined, { minimumFractionDigits: 3 })}</td>
                    <td className="text-right font-semibold">{Number(l.line_total).toLocaleString(undefined, { minimumFractionDigits: 3 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-surface flex justify-end">
          <div className="w-64">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Subtotal</span>
              <span>{Number(po.total).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted">Tax</span>
              <span>0.000 KWD</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border mt-2">
              <span className="font-bold">Grand Total</span>
              <span className="font-bold text-lg text-primary">{Number(po.total).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

