import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Play } from 'lucide-react';
import { posApi, itemApi } from '../retailApi';
import { useBillStore } from '../retailStore';

const RetailHeldBills = () => {
  const navigate = useNavigate();
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const { addItem, clearBill } = useBillStore();

  useEffect(() => {
    const fetchHeldBills = async () => {
      try {
        const res = await posApi.getHeldBills('default-branch'); // Adjust branchId logic if needed
        setHeldBills(res.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHeldBills();
  }, []);

  const handleResume = async (bill: any) => {
    try {
      // 1. Mark as resumed on backend (which deletes it or marks resumed)
      await posApi.resumeBill(bill.id);
      
      // 2. Clear current bill
      clearBill();
      
      // 3. Load items into cart
      // We need to fetch item details because bill.lines only has item_id and quantity
      const itemsRes = await itemApi.getItems();
      const allItems = itemsRes.data?.data || [];
      
      for (const line of bill.lines) {
        const item = allItems.find((i: any) => i.id === line.item_id);
        if (item) {
          addItem(item, Number(line.quantity));
          // Note: you may need a more advanced addItem to restore precise rate/discount
        }
      }
      
      navigate('/retail/bill');
    } catch (e) {
      console.error(e);
      alert('Failed to resume bill');
    }
  };

  return (
    <div className="r-page">
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate('/retail/home')}>
          <ArrowLeft size={22} />
        </button>
        <h1>Held Bills</h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="r-section" style={{ marginTop: 'var(--r-space-md)' }}>
        {heldBills.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--r-text-muted)', marginTop: 40 }}>
            <Clock size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: 16 }} />
            <div>No bills on hold</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--r-space-sm)' }}>
            {heldBills.map(bill => (
              <div key={bill.id} className="r-card r-card--elevated" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Held at {new Date(bill.held_at).toLocaleTimeString()}</div>
                  <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)' }}>
                    {bill.lines.length} items
                  </div>
                </div>
                <button className="r-btn r-btn--primary r-btn--sm" onClick={() => handleResume(bill)}>
                  <Play size={16} />
                  Resume
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailHeldBills;
