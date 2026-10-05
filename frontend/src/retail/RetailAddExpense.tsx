import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Plus } from 'lucide-react';
import { expenseApi } from './retailApi';

const RetailAddExpense = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'BUSINESS_EXPENSE',
    category_id: '',
    amount: '',
    payment_method: 'CASH',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await expenseApi.getCategories();
      setCategories(res.data || []);
      if (res.data?.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) return;
    try {
      await expenseApi.createCategory({ name: newCategoryName });
      setNewCategoryName('');
      setShowAddCategory(false);
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (formData.type === 'BUSINESS_EXPENSE' && !formData.category_id) {
      alert('Please select a category');
      return;
    }

    setLoading(true);
    try {
      await expenseApi.createExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      navigate('/retail/expenses');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="r-screen">
      <div className="r-header">
        <button className="r-back-btn" onClick={() => navigate('/retail/home')}>
          <ArrowLeft size={24} />
        </button>
        <div className="r-header-title">Add Expense</div>
      </div>

      <div className="r-content r-content--padded">
        <div className="r-form-group">
          <label className="r-label">Type</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`r-btn ${formData.type === 'BUSINESS_EXPENSE' ? 'r-btn--primary' : 'r-btn--outline'}`}
              style={{ flex: 1 }}
              onClick={() => setFormData({ ...formData, type: 'BUSINESS_EXPENSE' })}
            >
              Shop Expense
            </button>
            <button
              className={`r-btn ${formData.type === 'OWNER_WITHDRAWAL' ? 'r-btn--primary' : 'r-btn--outline'}`}
              style={{ flex: 1 }}
              onClick={() => setFormData({ ...formData, type: 'OWNER_WITHDRAWAL' })}
            >
              Owner Took Money
            </button>
          </div>
        </div>

        {formData.type === 'BUSINESS_EXPENSE' && (
          <div className="r-form-group">
            <label className="r-label">Category</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="r-input"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                style={{ flex: 1 }}
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="r-btn r-btn--outline" onClick={() => setShowAddCategory(!showAddCategory)}>
                <Plus size={20} />
              </button>
            </div>
            {showAddCategory && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  className="r-input"
                  placeholder="New Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="r-btn r-btn--primary" onClick={handleCreateCategory}>Save</button>
              </div>
            )}
          </div>
        )}

        <div className="r-form-group">
          <label className="r-label">Amount (₹)</label>
          <input
            type="number"
            className="r-input"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        <div className="r-form-group">
          <label className="r-label">Payment Method</label>
          <div className="r-payment-methods">
            {['CASH', 'UPI', 'BANK', 'CARD'].map(method => (
              <button
                key={method}
                className={`r-payment-method ${formData.payment_method === method ? 'r-payment-method--active' : ''}`}
                onClick={() => setFormData({ ...formData, payment_method: method })}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="r-form-group">
          <label className="r-label">Date</label>
          <input
            type="date"
            className="r-input"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="r-form-group">
          <label className="r-label">Note (Optional)</label>
          <input
            type="text"
            className="r-input"
            placeholder="What was this for?"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
        
        {/* Attachment feature could be added here similar to RetailNewBill */}
        <div className="r-form-group">
           <button className="r-btn r-btn--outline r-btn--full">
             <Camera size={20} /> Add Bill Photo
           </button>
        </div>
      </div>

      <div className="r-bottom-action">
        <button
          className="r-btn r-btn--primary r-btn--full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </div>
  );
};

export default RetailAddExpense;
