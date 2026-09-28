import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  
  return (
    <div className="dashboard-wrapper">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="card mt-4 mb-4">
        <h3 className="card-title">Welcome back, {user?.display_name || user?.username}!</h3>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          This is the EVOLIX Trade ERP Foundation dashboard. You are logged in as {(user as any)?.roles?.[0]?.role?.name || 'a User'}, giving you control over active modules via the sidebar on the left.
        </p>
      </div>
      
      <div className="kpi-grid">
        <div className="kpi-card accent-success">
          <span className="kpi-label">Cash in Hand</span>
          <span className="kpi-value" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem' }}>Awaiting Module 05</span>
        </div>
        <div className="kpi-card accent-info">
          <span className="kpi-label">Stock Value</span>
          <span className="kpi-value" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem' }}>Awaiting Module 06</span>
        </div>
        <div className="kpi-card accent-primary">
          <span className="kpi-label">Bank Account</span>
          <span className="kpi-value" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem' }}>Awaiting Module 05</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card accent-warning">
          <span className="kpi-label">Pending Orders</span>
          <span className="kpi-value" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem' }}>Awaiting Module 07 Dashboard</span>
        </div>
        <div className="kpi-card accent-danger">
          <span className="kpi-label">Payables</span>
          <span className="kpi-value" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem' }}>Awaiting Module 05</span>
        </div>
        <div className="kpi-card accent-success">
          <span className="kpi-label">Receivables</span>
          <span className="kpi-value" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem' }}>Awaiting Module 05</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
