import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Undo2, AlertCircle } from 'lucide-react';
import { posApi } from '../retailApi';

const RetailReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState('CASH');

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await posApi.getBillDetail(id!);
        setBill(res.data || null);
        
        // Default return everything to 0
        const init: Record<string, number> = {};
        res.data?.sales_invoice_line?.forEach((line: any) => {
          init[line.id] = 0;
        });
        setReturnItems(init);
      } catch (e) {
        console.error(e);
      }
    };
    if (id) fetchBill();
  }, [id]);

  if (!bill) return <div className="r-page" style={{ padding: 20 }}>Loading...</div>;

  const handleUpdateReturnQty = (lineId: string, delta: number) => {
    const line = bill.sales_invoice_line.find((l: any) => l.id === lineId);
    if (!line) return;

    setReturnItems(prev => {
      const current = prev[lineId] || 0;
      let next = current + delta;
      if (next < 0) next = 0;
      if (next > Number(line.quantity)) next = Number(line.quantity);
      return { ...prev, [lineId]: next };
    });
  };

  const totalReturnAmount = bill.sales_invoice_line?.reduce((sum: number, line: any) => {
    const qty = returnItems[line.id] || 0;
    return sum + (qty * Number(line.rate));
  }, 0) || 0;

  const handleSubmitReturn = async () => {
    if (totalReturnAmount === 0) return;

    try {
      const linesToReturn = bill.sales_invoice_line
        .filter((l: any) => returnItems[l.id] > 0)
        .map((l: any) => ({
          item_id: l.item_id,
          quantity: returnItems[l.id],
          rate: Number(l.rate),
          discount_amount: 0 // Simplification for retail
        }));

      await posApi.postReturn({
        original_invoice_id: bill.id,
        lines: linesToReturn,
        refund_method: refundMethod
      });

      alert('Return processed successfully!');
      navigate('/retail/bills');
    } catch (e) {
      console.error(e);
      alert('Failed to process return');
    }
  };

  return (
    <div className="r-page-with-sticky" style={{ paddingBottom: 100 }}>
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1>Sale Return</h1>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ padding: 'var(--r-space-md) var(--r-space-base)', background: 'var(--r-warning-light)', color: 'var(--r-warning)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 'var(--r-text-sm)' }}>
          Select the quantity to return for each item. 
          The refund will be processed and stock will be added back.
        </div>
      </div>

      <div className="r-section" style={{ marginTop: 'var(--r-space-md)' }}>
        <h3 style={{ fontSize: 'var(--r-text-lg)', fontWeight: 600, marginBottom: 'var(--r-space-sm)' }}>Bill Items</h3>
        <div className="r-card">
          {bill.sales_invoice_line?.map((line: any) => (
            <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--r-space-md)', paddingBottom: 'var(--r-space-md)', borderBottom: '1px solid var(--r-divider)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{line.item?.name}</div>
                <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)' }}>
                  Max: {Number(line.quantity)} @ ₹{Number(line.rate)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button 
                  className="r-btn r-btn--icon r-btn--ghost" 
                  onClick={() => handleUpdateReturnQty(line.id, -1)}
                  style={{ background: 'var(--r-bg-grey)' }}
                >
                  -
                </button>
                <div style={{ fontWeight: 700, width: 24, textAlign: 'center' }}>
                  {returnItems[line.id] || 0}
                </div>
                <button 
                  className="r-btn r-btn--icon r-btn--ghost" 
                  onClick={() => handleUpdateReturnQty(line.id, 1)}
                  style={{ background: 'var(--r-bg-grey)' }}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="r-section" style={{ marginTop: 'var(--r-space-md)' }}>
        <h3 style={{ fontSize: 'var(--r-text-lg)', fontWeight: 600, marginBottom: 'var(--r-space-sm)' }}>Refund Method</h3>
        <div className="r-card" style={{ display: 'flex', gap: 'var(--r-space-sm)' }}>
          <button 
            className={`r-btn r-flex-1 ${refundMethod === 'CASH' ? 'r-btn--primary' : 'r-btn--outline'}`}
            onClick={() => setRefundMethod('CASH')}
          >
            Cash Refund
          </button>
          <button 
            className={`r-btn r-flex-1 ${refundMethod === 'CREDIT' ? 'r-btn--primary' : 'r-btn--outline'}`}
            onClick={() => setRefundMethod('CREDIT')}
          >
            Add to Khata
          </button>
        </div>
      </div>

      <div className="r-sticky-bottom">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--r-space-sm)' }}>
          <span style={{ color: 'var(--r-text-muted)' }}>Refund Amount</span>
          <span style={{ fontSize: 'var(--r-text-xl)', fontWeight: 800 }}>₹{totalReturnAmount.toLocaleString('en-IN')}</span>
        </div>
        <button 
          className="r-btn r-btn--primary r-w-full"
          disabled={totalReturnAmount === 0}
          onClick={handleSubmitReturn}
        >
          <Undo2 size={20} /> Process Return
        </button>
      </div>
    </div>
  );
};

export default RetailReturn;
