import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Undo2 } from 'lucide-react';
import { posApi } from '../retailApi';

const RetailBillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await posApi.getBillDetail(id!);
        setBill(res.data || null);
      } catch (e) {
        console.error(e);
      }
    };
    if (id) fetchBill();
  }, [id]);

  if (!bill) return <div className="r-page" style={{ padding: 20 }}>Loading...</div>;

  return (
    <div className="r-page-with-sticky" style={{ paddingBottom: 80 }}>
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>Bill Details</h1>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ padding: 'var(--r-space-xl) var(--r-space-base)', textAlign: 'center', borderBottom: '1px solid var(--r-divider)' }}>
        <div style={{ fontSize: 'var(--r-text-4xl)', fontWeight: 800, letterSpacing: '-0.03em' }}>
          ₹{Number(bill.grand_total).toLocaleString('en-IN')}
        </div>
        <div style={{ color: 'var(--r-text-muted)', marginTop: 4 }}>
          {bill.document_number} • {new Date(bill.document_date).toLocaleDateString()}
        </div>
      </div>

      <div className="r-section" style={{ marginTop: 'var(--r-space-lg)' }}>
        <div className="r-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-sm)' }}>
            <span style={{ color: 'var(--r-text-muted)' }}>Customer</span>
            <span style={{ fontWeight: 600 }}>{bill.party?.name || 'Walk-in Customer'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-sm)' }}>
            <span style={{ color: 'var(--r-text-muted)' }}>Status</span>
            <span style={{ fontWeight: 600 }}>{bill.status}</span>
          </div>
        </div>
      </div>

      <div className="r-section" style={{ marginTop: 'var(--r-space-lg)' }}>
        <h3 style={{ fontSize: 'var(--r-text-lg)', fontWeight: 600, marginBottom: 'var(--r-space-md)' }}>Items</h3>
        <div className="r-card">
          {bill.sales_invoice_line?.map((line: any) => (
            <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-md)', paddingBottom: 'var(--r-space-md)', borderBottom: '1px solid var(--r-divider)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{line.item?.name}</div>
                <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)' }}>
                  {Number(line.quantity)} x ₹{Number(line.rate)}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>
                ₹{Number(line.line_total).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: 'var(--r-space-sm)' }}>
            <span>Total</span>
            <span>₹{Number(bill.grand_total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="r-sticky-bottom">
        <div style={{ display: 'flex', gap: 'var(--r-space-md)' }}>
          <button className="r-btn r-btn--ghost r-flex-1">
            <Share2 size={20} /> Share
          </button>
          <button 
            className="r-btn r-btn--primary r-flex-1"
            onClick={() => navigate(`/retail/bills/${id}/print`, { state: { bill } })}
          >
            <Printer size={20} /> Print
          </button>
        </div>
        {bill.status === 'POSTED' && (
          <button className="r-btn r-btn--outline r-w-full" style={{ marginTop: 'var(--r-space-md)', color: 'var(--r-danger)', borderColor: 'var(--r-danger)' }} onClick={() => navigate(`/retail/bills/${id}/return`)}>
            <Undo2 size={20} />
            Sale Return
          </button>
        )}
      </div>
    </div>
  );
};

export default RetailBillDetail;
