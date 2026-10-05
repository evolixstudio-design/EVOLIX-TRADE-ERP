import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Calculator } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';

export default function PurchaseOrderCreate() {
  const navigate = useNavigate();
  const activeCompanyId = useAuthStore((s: any) => s.activeCompanyId);

  const [saving, setSaving] = useState(false);
  
  // Master data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Form State
  const [header, setHeader] = useState({
    party_id: '',
    branch_id: '',
    document_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
  });

  const [lines, setLines] = useState([
    { item_id: '', unit_id: '', ordered_quantity: 1, rate: 0, discount: 0, tax: 0 }
  ]);

  useEffect(() => {
    // Awaiting Module 04 for Masters API
    const fetchMasters = async () => {
      try {
        setSuppliers([]);
        setItems([]);
        setUnits([]);
        setBranches([]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMasters();
  }, [activeCompanyId]);

  const addLine = () => {
    setLines([...lines, { item_id: '', unit_id: '', ordered_quantity: 1, rate: 0, discount: 0, tax: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto-fill rate if item selected
    if (field === 'item_id') {
      const item = items.find(i => i.id === value);
      if (item) {
        newLines[index].rate = item.rate;
        newLines[index].unit_id = units[0]?.id; // default unit
      }
    }
    
    setLines(newLines);
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + (Number(line.ordered_quantity) * Number(line.rate) - Number(line.discount)), 0);
  };
  const calculateTotal = () => {
    return lines.reduce((sum, line) => {
      const lineNet = (Number(line.ordered_quantity) * Number(line.rate)) - Number(line.discount);
      return sum + lineNet + Number(line.tax);
    }, 0);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        company_id: activeCompanyId || '00000000-0000-0000-0000-000000000000',
        ...header,
        document_number: `PO-${Date.now()}`,
        status: 'DRAFT',
        total: calculateTotal(),
        lines: lines.filter(l => l.item_id).map(l => ({
          ...l,
          line_total: (Number(l.ordered_quantity) * Number(l.rate)) - Number(l.discount) + Number(l.tax)
        }))
      };

      await api.post('/purchase/orders', payload);
      navigate('/purchasing/orders');
    } catch (e) {
      console.error(e);
      alert('Failed to save PO. Check console.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <button className="btn btn-secondary btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="mb-0">New Purchase Order</h1>
            <div className="text-muted text-sm mt-1">Fast Entry Mode</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" disabled={saving} onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !header.party_id}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Supplier <span className="text-danger">*</span></label>
            <select className="form-control" value={header.party_id} onChange={e => setHeader({...header, party_id: e.target.value})}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={header.document_date} onChange={e => setHeader({...header, document_date: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Delivery</label>
            <input type="date" className="form-control" value={header.expected_delivery_date} onChange={e => setHeader({...header, expected_delivery_date: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Receiving Branch</label>
            <select className="form-control" value={header.branch_id} onChange={e => setHeader({...header, branch_id: e.target.value})}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-hover flex items-center gap-2">
          <Calculator size={18} className="text-primary" />
          <h2 className="mb-0 text-base font-semibold">Items Grid</h2>
        </div>
        <div className="table-container border-0 rounded-none shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '30%' }}>Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>Disc</th>
                <th className="text-right">Line Total</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const total = (Number(line.ordered_quantity) * Number(line.rate)) - Number(line.discount);
                return (
                  <tr key={idx}>
                    <td className="text-muted text-sm">{idx + 1}</td>
                    <td>
                      <select className="form-control bg-transparent border-transparent hover:border-border focus:bg-surface" 
                        value={line.item_id} onChange={e => updateLine(idx, 'item_id', e.target.value)}>
                        <option value="">Select Item</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" min="1" className="form-control bg-transparent border-transparent hover:border-border focus:bg-surface" 
                        value={line.ordered_quantity} onChange={e => updateLine(idx, 'ordered_quantity', e.target.value)} />
                    </td>
                    <td>
                      <select className="form-control bg-transparent border-transparent hover:border-border focus:bg-surface"
                        value={line.unit_id} onChange={e => updateLine(idx, 'unit_id', e.target.value)}>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" step="0.001" className="form-control bg-transparent border-transparent hover:border-border focus:bg-surface" 
                        value={line.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" step="0.001" className="form-control bg-transparent border-transparent hover:border-border focus:bg-surface" 
                        value={line.discount} onChange={e => updateLine(idx, 'discount', e.target.value)} />
                    </td>
                    <td className="text-right font-semibold align-middle">
                      {total.toFixed(3)}
                    </td>
                    <td className="text-center align-middle">
                      <button className="text-danger hover:text-danger-hover p-1" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center bg-surface">
          <button className="btn btn-secondary text-primary" onClick={addLine}>
            <Plus size={16} /> Add Row (Alt+N)
          </button>
          
          <div className="w-64">
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{calculateSubtotal().toFixed(3)} KWD</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border mt-2">
              <span className="font-bold">Grand Total</span>
              <span className="font-bold text-lg text-primary">{calculateTotal().toFixed(3)} KWD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

