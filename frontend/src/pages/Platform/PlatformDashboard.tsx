import { useEffect, useState } from 'react';
import { Server, Activity, Shield, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/store/authStore';
import { Navigate } from 'react-router-dom';

interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  trial_tenants: number;
  plans: any[];
}

const PlatformDashboard = () => {
  const [stats, setStats] = useState<PlatformStats>({
    total_tenants: 0,
    active_tenants: 0,
    suspended_tenants: 0,
    trial_tenants: 0,
    plans: [],
  });
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  if (!user?.is_platform) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [tenantsRes] = await Promise.allSettled([
          api.get('/platform/admin/tenants'),
        ]);

        const tenants = tenantsRes.status === 'fulfilled' ? tenantsRes.value.data : [];

        setStats({
          total_tenants: tenants.length,
          active_tenants: tenants.filter((t: any) => t.status === 'ACTIVE').length,
          suspended_tenants: tenants.filter((t: any) => t.status === 'SUSPENDED').length,
          trial_tenants: tenants.filter((t: any) => t.status === 'TRIAL').length,
          plans: [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    {
      label: 'Total Organizations',
      value: stats.total_tenants,
      icon: Server,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
    },
    {
      label: 'Active',
      value: stats.active_tenants,
      icon: CheckCircle2,
      color: 'var(--success)',
      bg: 'var(--success-light)',
    },
    {
      label: 'Suspended',
      value: stats.suspended_tenants,
      icon: AlertCircle,
      color: 'var(--danger)',
      bg: 'var(--danger-light)',
    },
    {
      label: 'Trial',
      value: stats.trial_tenants,
      icon: CreditCard,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Platform Dashboard</h1>
          <p className="page-subtitle">EVOLIX Platform Administration Overview</p>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card-platform" style={{ borderLeftColor: kpi.color }}>
            <div className="kpi-card-icon" style={{ background: kpi.bg, color: kpi.color }}>
              <kpi.icon size={22} />
            </div>
            <div className="kpi-card-content">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">{loading ? '—' : kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <Activity size={18} />
            System Health
          </div>
          <div className="system-health-grid">
            <div className="health-item-card">
              <div className="health-dot healthy" />
              <div>
                <div className="health-name">API Server</div>
                <div className="health-status-text">Operational</div>
              </div>
            </div>
            <div className="health-item-card">
              <div className="health-dot healthy" />
              <div>
                <div className="health-name">Database</div>
                <div className="health-status-text">Connected</div>
              </div>
            </div>
            <div className="health-item-card">
              <div className="health-dot healthy" />
              <div>
                <div className="health-name">Authentication</div>
                <div className="health-status-text">Active</div>
              </div>
            </div>
            <div className="health-item-card">
              <div className="health-dot healthy" />
              <div>
                <div className="health-name">Provisioning</div>
                <div className="health-status-text">Ready</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Shield size={18} />
            Platform Information
          </div>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Platform Version</span>
              <span className="info-value">0.1.0</span>
            </div>
            <div className="info-row">
              <span className="info-label">Backend</span>
              <span className="info-value">NestJS + Prisma</span>
            </div>
            <div className="info-row">
              <span className="info-label">Database</span>
              <span className="info-value">PostgreSQL</span>
            </div>
            <div className="info-row">
              <span className="info-label">Auth Mode</span>
              <span className="info-value">JWT + Platform Guard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;

