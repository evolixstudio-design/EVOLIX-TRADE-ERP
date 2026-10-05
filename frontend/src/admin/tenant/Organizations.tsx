import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Ban, CheckCircle, X } from 'lucide-react';
import api from '../../shared/api';
import { Modal } from '../../shared/components/Modal';

interface OrgData {
  id: string;
  name: string;
  legal_name: string | null;
  code: string;
  is_active: boolean;
  created_at: string;
}

const Organizations = () => {
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<OrgData | null>(null);
  const [formData, setFormData] = useState({ name: '', legal_name: '', code: '' });
  const [formError, setFormError] = useState('');

  const fetchOrgs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/organizations/', { params: { q: search || undefined } });
      setOrgs(res.data);
    } catch {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchOrgs(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/organizations/', formData);
      setShowCreate(false);
      setFormData({ name: '', legal_name: '', code: '' });
      fetchOrgs();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    setFormError('');
    try {
      await api.patch(`/organizations/${showEdit.id}`, {
        name: showEdit.name,
        legal_name: showEdit.legal_name,
      });
      setShowEdit(null);
      fetchOrgs();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to update');
    }
  };

  const handleToggleStatus = async (org: OrgData) => {
    const action = org.is_active ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} "${org.name}"?`)) return;
    try {
      await api.patch(`/organizations/${org.id}/${action}`);
      fetchOrgs();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Organization Management</h1>
        <button className="btn btn-primary" onClick={() => { setFormData({ name: '', legal_name: '', code: '' }); setFormError(''); setShowCreate(true); }}>
          <Plus size={16} /> Create Organization
        </button>
      </div>

      <div className="card mb-4 flex items-center gap-2">
        <Search size={18} className="text-muted" />
        <input type="text" className="form-control" placeholder="Search organizations..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="btn btn-secondary btn-icon" onClick={() => setSearch('')}><X size={16} /></button>}
      </div>

      {error && <div className="form-error mb-4">{error}</div>}

      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Legal Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center">Loading...</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={5} className="text-center">No organizations found.</td></tr>
            ) : (
              orgs.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.code}</strong></td>
                  <td>{o.name}</td>
                  <td>{o.legal_name || '—'}</td>
                  <td>
                    {o.is_active
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-danger">Disabled</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-icon" title="Edit" onClick={() => { setFormError(''); setShowEdit(o); }}><Edit size={16} /></button>
                      {o.is_active
                        ? <button className="btn btn-danger btn-icon" title="Disable" onClick={() => handleToggleStatus(o)}><Ban size={16} /></button>
                        : <button className="btn btn-secondary btn-icon" title="Enable" onClick={() => handleToggleStatus(o)}><CheckCircle size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Create Organization" isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          {formError && <div className="form-error mb-4">{formError}</div>}
          <div className="form-group">
            <label className="form-label">Code</label>
            <input required type="text" className="form-control" placeholder="e.g. ACME" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Legal Name</label>
            <input type="text" className="form-control" value={formData.legal_name} onChange={e => setFormData({ ...formData, legal_name: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Organization" isOpen={!!showEdit} onClose={() => setShowEdit(null)}>
        {showEdit && (
          <form onSubmit={handleUpdate}>
            {formError && <div className="form-error mb-4">{formError}</div>}
            <div className="form-group">
              <label className="form-label">Code</label>
              <input type="text" className="form-control" value={showEdit.code} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input required type="text" className="form-control" value={showEdit.name} onChange={e => setShowEdit({ ...showEdit, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Legal Name</label>
              <input type="text" className="form-control" value={showEdit.legal_name || ''} onChange={e => setShowEdit({ ...showEdit, legal_name: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Organizations;

