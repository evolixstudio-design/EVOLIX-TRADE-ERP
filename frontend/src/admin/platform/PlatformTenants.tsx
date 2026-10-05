import { useEffect, useState } from 'react';
import { Plus, Mail, Eye, AlertCircle } from 'lucide-react';
import api from '../../shared/api';
import { Modal } from '../../shared/components/Modal';
import { useAuthStore } from '../../shared/store/authStore';
import { Navigate } from 'react-router-dom';

const PlatformTenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [inviteData, setInviteData] = useState({ email: '', name: '' });
  const [inviteResult, setInviteResult] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    organizationName: '',
    organizationCode: '',
    companyName: '',
    companyCode: '',
    branchName: 'Main Branch',
    branchCode: 'HQ',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
  });

  if (!user?.is_platform) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform/admin/tenants');
      setTenants(res.data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.post('/platform/admin/tenants', createForm);
      setShowCreate(false);
      setCreateForm({
        organizationName: '',
        organizationCode: '',
        companyName: '',
        companyCode: '',
        branchName: 'Main Branch',
        branchCode: 'HQ',
        adminEmail: '',
        adminName: '',
        adminPassword: '',
      });
      fetchTenants();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteResult('');
    try {
      const res = await api.post(`/platform/admin/tenants/${showInvite}/invite`, inviteData);
      setInviteResult(`Invitation created. Token: ${res.data.token}`);
      setInviteData({ email: '', name: '' });
    } catch (err: any) {
      setInviteResult(`Error: ${err.response?.data?.message || 'Failed'}`);
    }
  };

  const handleStatusChange = async (tenantId: string, status: string) => {
    try {
      await api.patch(`/platform/admin/tenants/${tenantId}/status`, { status });
      fetchTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'badge-success';
      case 'SUSPENDED': return 'badge-danger';
      case 'TRIAL': return 'badge-warning';
      case 'CANCELLED': return 'badge-danger';
      default: return '';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Organizations / Tenants</h1>
          <p className="page-subtitle">Manage all tenant organizations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create Tenant
        </button>
      </div>

      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Companies</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                  Loading tenants...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                  No tenants found. Create one to get started.
                </td>
              </tr>
            ) : (
              tenants.map(t => (
                <tr key={t.id}>
                  <td className="font-semibold">{t.code}</td>
                  <td>{t.name}</td>
                  <td>
                    <span className={`badge ${statusColor(t.status || 'ACTIVE')}`}>
                      {t.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>{t.plan?.name || 'Default'}</td>
                  <td>{t.companies?.length || 0}</td>
                  <td className="text-muted text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowDetail(t)}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowInvite(t.id)}
                        title="Invite Owner"
                      >
                        <Mail size={14} />
                      </button>
                      {t.status !== 'SUSPENDED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(t.id, 'SUSPENDED')}
                          title="Suspend"
                          style={{ color: 'var(--danger)' }}
                        >
                          Suspend
                        </button>
                      )}
                      {t.status === 'SUSPENDED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(t.id, 'ACTIVE')}
                          title="Activate"
                          style={{ color: 'var(--success)' }}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Tenant Modal */}
      <Modal title="Create New Tenant" isOpen={showCreate} onClose={() => { setShowCreate(false); setCreateError(''); }}>
        {createError && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            {createError}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={createForm.organizationName}
                onChange={e => setCreateForm({ ...createForm, organizationName: e.target.value })}
                placeholder="e.g. ABC Hardware"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Organization Code *</label>
              <input
                type="text"
                className="form-control"
                required
                value={createForm.organizationCode}
                onChange={e => setCreateForm({ ...createForm, organizationCode: e.target.value.toUpperCase() })}
                placeholder="e.g. ABC-HW"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={createForm.companyName}
                onChange={e => setCreateForm({ ...createForm, companyName: e.target.value })}
                placeholder="e.g. ABC Hardware Pvt Ltd"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Code *</label>
              <input
                type="text"
                className="form-control"
                required
                value={createForm.companyCode}
                onChange={e => setCreateForm({ ...createForm, companyCode: e.target.value.toUpperCase() })}
                placeholder="e.g. ABC-COMP"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Branch</label>
              <input
                type="text"
                className="form-control"
                value={createForm.branchName}
                onChange={e => setCreateForm({ ...createForm, branchName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Branch Code</label>
              <input
                type="text"
                className="form-control"
                value={createForm.branchCode}
                onChange={e => setCreateForm({ ...createForm, branchCode: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="form-section-title">Owner Account</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Owner Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={createForm.adminName}
                onChange={e => setCreateForm({ ...createForm, adminName: e.target.value })}
                placeholder="Owner full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Email *</label>
              <input
                type="email"
                className="form-control"
                required
                value={createForm.adminEmail}
                onChange={e => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                placeholder="owner@company.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input
                type="password"
                className="form-control"
                required
                minLength={6}
                value={createForm.adminPassword}
                onChange={e => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                placeholder="Min 6 characters"
              />
              <small className="text-muted">Owner should change this on first login.</small>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Owner Modal */}
      <Modal title="Invite Tenant Owner" isOpen={!!showInvite} onClose={() => { setShowInvite(null); setInviteResult(''); }}>
        {inviteResult ? (
          <div className={`alert ${inviteResult.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>
            {inviteResult}
          </div>
        ) : (
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input type="text" className="form-control" required value={inviteData.name} onChange={e => setInviteData({ ...inviteData, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Email</label>
              <input type="email" className="form-control" required value={inviteData.email} onChange={e => setInviteData({ ...inviteData, email: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Send Invitation</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal title="Tenant Details" isOpen={!!showDetail} onClose={() => setShowDetail(null)}>
        {showDetail && (
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Organization</span>
              <span className="info-value">{showDetail.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Code</span>
              <span className="info-value">{showDetail.code}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className={`badge ${statusColor(showDetail.status || 'ACTIVE')}`}>{showDetail.status || 'ACTIVE'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Plan</span>
              <span className="info-value">{showDetail.plan?.name || 'Default'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Created</span>
              <span className="info-value">{new Date(showDetail.created_at).toLocaleString()}</span>
            </div>
            {showDetail.companies?.length > 0 && (
              <>
                <div className="form-section-title">Companies</div>
                {showDetail.companies.map((c: any) => (
                  <div key={c.id} className="info-row">
                    <span className="info-label">{c.code}</span>
                    <span className="info-value">{c.trade_name || c.legal_name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlatformTenants;

