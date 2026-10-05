/**
 * EVOLIX Retail V1 — More Menu
 * 
 * Simple, grouped menu avoiding dense ERP navigation.
 */
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, IndianRupee, TrendingUp,
  Wallet, Users, BookUser, Settings,
  LogOut, UserCircle, ChevronRight, Grid, Database, Receipt
} from 'lucide-react';
import { useAuthStore } from '../shared/store/authStore';

const RetailMore = () => {
  const navigate = useNavigate();
  const { user, tenantContext, logout } = useAuthStore();

  const handleLogout = () => {
    // Call api if needed, then logout locally
    logout();
  };

  const menuGroups = [
    {
      title: 'Business',
      items: [
        { icon: Receipt, label: 'Bill History', desc: 'View past bills', path: '/retail/bills' },
        { icon: ShoppingCart, label: 'Purchases', desc: 'Add or view purchases', path: '/retail/purchases' },
        { icon: IndianRupee, label: 'Expenses', desc: 'Manage daily expenses', path: '/retail/more/expenses' },
        { icon: TrendingUp, label: 'Reports', desc: 'Sales, Profit, Stock reports', path: '/retail/more/reports' },
      ]
    },
    {
      title: 'Money',
      items: [
        { icon: Wallet, label: 'Cash & Bank', desc: 'Manage cash counter & accounts', path: '/retail/more/cash-bank' },
        { icon: BookUser, label: 'Supplier Due', desc: 'What you owe suppliers', path: '/retail/more/supplier-due' },
      ]
    },
    {
      title: 'Products & People',
      items: [
        { icon: Grid, label: 'Need List', desc: 'Mangwana Hai', path: '/retail/needs' },
        { icon: Users, label: 'Suppliers', desc: 'Manage suppliers', path: '/retail/suppliers' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Settings, label: 'Settings', desc: 'Shop, Print & Bill settings', path: '/retail/more/settings' },
        { icon: Database, label: 'Backup & Restore', desc: 'Secure your data', path: '/retail/more/backup' },
      ]
    }
  ];

  return (
    <>
      <div className="r-page-header">
        <h1>More</h1>
      </div>

      {/* User Profile Summary */}
      <div className="r-section" style={{ marginTop: 'var(--r-space-sm)' }}>
        <div className="r-card r-card--elevated" style={{ display: 'flex', alignItems: 'center', gap: 'var(--r-space-md)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--r-primary-light)', color: 'var(--r-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserCircle size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--r-text-lg)', fontWeight: 700 }}>
              {tenantContext?.company_name || user?.display_name || 'My Shop'}
            </div>
            <div style={{ fontSize: 'var(--r-text-sm)', color: 'var(--r-text-secondary)' }}>
              {user?.email || user?.phone || user?.username}
            </div>
          </div>
          <button className="r-btn r-btn--ghost r-btn--sm" onClick={() => {/* edit profile */}}>
            Edit
          </button>
        </div>
      </div>

      {/* Menu Groups */}
      <div style={{ paddingBottom: 'var(--r-space-lg)' }}>
        {menuGroups.map((group, idx) => (
          <div key={idx} className="r-menu-group">
            <div className="r-menu-group-title">{group.title}</div>
            
            <div style={{ background: 'var(--r-surface)', borderTop: '1px solid var(--r-border-light)', borderBottom: '1px solid var(--r-border-light)' }}>
              {group.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  className="r-menu-item"
                  onClick={() => navigate(item.path)}
                  style={{
                    borderBottom: itemIdx < group.items.length - 1 ? '1px solid var(--r-divider)' : 'none'
                  }}
                >
                  <div className="r-menu-icon">
                    <item.icon size={20} />
                  </div>
                  <div className="r-menu-text">
                    <span>{item.label}</span>
                    <small>{item.desc}</small>
                  </div>
                  <ChevronRight className="r-menu-chevron" size={20} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="r-section" style={{ marginTop: 'var(--r-space-xl)' }}>
          <button
            className="r-btn r-btn--danger-ghost r-btn--full"
            onClick={handleLogout}
            id="logout-btn"
          >
            <LogOut size={18} />
            Log Out
          </button>
          
          <div style={{ textAlign: 'center', marginTop: 'var(--r-space-lg)', color: 'var(--r-text-hint)', fontSize: 'var(--r-text-xs)' }}>
            EVOLIX Retail V1 <br/> Version 1.0.0
          </div>
        </div>
      </div>
    </>
  );
};

export default RetailMore;
