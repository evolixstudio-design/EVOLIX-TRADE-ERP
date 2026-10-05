import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Receipt } from 'lucide-react';
import { posApi } from '../retailApi';

const RetailBillHistory = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await posApi.getBills();
        setBills(res.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchBills();
  }, []);

  return (
    <div className="r-page">
      <div className="r-page-header">
        <button className="r-btn r-btn--icon" onClick={() => navigate('/retail/home')}>
          <ArrowLeft size={22} />
        </button>
        <h1>Bill History</h1>
        <div style={{ width: 48 }} />
      </div>

      <div className="r-search-bar" style={{ margin: 'var(--r-space-md) var(--r-space-base)' }}>
        <span className="r-search-icon"><Search size={20} /></span>
        <input type="text" placeholder="Search by Bill No. or Customer" />
        <button className="r-search-action"><Filter size={18} /></button>
      </div>

      <div className="r-section">
        {bills.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--r-text-muted)', marginTop: 40 }}>
            <Receipt size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: 16 }} />
            <div>No bills found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--r-space-sm)' }}>
            {bills.map(bill => (
              <div 
                key={bill.id} 
                className="r-card r-card--elevated r-card--tappable"
                onClick={() => navigate(`/retail/bills/${bill.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{bill.document_number}</div>
                  <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-muted)' }}>
                    {bill.party?.name || 'Walk-in'} • {new Date(bill.document_date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--r-text)' }}>
                  ₹{Number(bill.grand_total).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailBillHistory;
