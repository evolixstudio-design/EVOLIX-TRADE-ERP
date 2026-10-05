import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { expenseApi } from './retailApi';

const RetailExpenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ today_business_expenses: 0, month_business_expenses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        expenseApi.getExpenses(),
        expenseApi.getSummary()
      ]);
      setExpenses(expRes.data?.data || []);
      setSummary(sumRes.data || { today_business_expenses: 0, month_business_expenses: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelExpense = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this expense?')) return;
    try {
      await expenseApi.cancelExpense(id);
      fetchData();
    } catch (err) {
      alert('Failed to cancel expense');
    }
  };

  return (
    <div className="r-screen">
      <div className="r-header">
        <button className="r-back-btn" onClick={() => navigate('/retail/home')}>
          <ArrowLeft size={24} />
        </button>
        <div className="r-header-title">Expenses</div>
      </div>

      <div className="r-content">
        <div className="r-section" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="r-card" style={{ flex: 1, backgroundColor: 'var(--r-bg-secondary)' }}>
            <div className="r-card-title">Today's Expenses</div>
            <div className="r-card-value">₹{summary.today_business_expenses.toLocaleString('en-IN')}</div>
          </div>
          <div className="r-card" style={{ flex: 1, backgroundColor: 'var(--r-bg-secondary)' }}>
            <div className="r-card-title">This Month</div>
            <div className="r-card-value">₹{summary.month_business_expenses.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="r-section">
          {loading ? (
            <div className="r-empty-state">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="r-empty-state">
              <div className="r-empty-state-icon">💸</div>
              <div className="r-empty-state-title">No expenses yet</div>
              <div className="r-empty-state-subtitle">Record your daily shop expenses here</div>
            </div>
          ) : (
            <div className="r-list">
              {expenses.map((exp: any) => (
                <div key={exp.id} className="r-list-item" style={{ opacity: exp.status === 'CANCELLED' ? 0.5 : 1 }}>
                  <div className="r-list-item-content">
                    <div className="r-list-item-title">
                      {exp.type === 'OWNER_WITHDRAWAL' ? 'Owner Withdrawal' : exp.category?.name || 'Expense'}
                      {exp.status === 'CANCELLED' && ' (Cancelled)'}
                    </div>
                    <div className="r-list-item-subtitle">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {exp.payment_method}
                    </div>
                    {exp.note && <div className="r-list-item-subtitle">{exp.note}</div>}
                  </div>
                  <div className="r-list-item-right">
                    <div className="r-list-item-value r-text-danger">
                      ₹{Number(exp.amount).toLocaleString('en-IN')}
                    </div>
                    {exp.status === 'POSTED' && (
                      <button className="r-btn r-btn--outline" onClick={() => cancelExpense(exp.id)} style={{ padding: '4px', marginTop: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="r-bottom-action">
        <button className="r-btn r-btn--primary r-btn--full" onClick={() => navigate('/retail/expenses/add')}>
          <Plus size={20} /> Record Expense
        </button>
      </div>
    </div>
  );
};

export default RetailExpenses;
