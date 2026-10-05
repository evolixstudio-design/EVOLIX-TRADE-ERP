import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './shared/store/authStore';

// Auth
import Login from './pages/Login';

// Shells
import TenantShell from './shared/components/TenantShell';
import PlatformShell from './shared/components/PlatformShell';

// Tenant Pages
import Users from './admin/tenant/Users';
import Roles from './admin/tenant/Roles';
import Sessions from './admin/tenant/Sessions';
import Organizations from './admin/tenant/Organizations';
import Companies from './admin/tenant/Companies';
import Branches from './admin/tenant/Branches';
import Godowns from './admin/tenant/Godowns';
import FinancialYears from './admin/tenant/FinancialYears';

// Accounting Module
import ChartOfAccounts from './pages/Accounting/ChartOfAccounts';
import Ledger from './pages/Accounting/Ledger';
import BankAccounts from './pages/Accounting/BankAccounts';

// Inventory Module
import StockSummary from './pages/Inventory/StockSummary';
import StockMovements from './pages/Inventory/StockMovements';
import StockAdjustments from './pages/Inventory/StockAdjustments';
import StockTransfers from './pages/Inventory/StockTransfers';
import BarcodeLabels from './pages/Inventory/BarcodeLabels';

// Platform Pages
import PlatformDashboard from './admin/platform/PlatformDashboard';
import PlatformTenants from './admin/platform/PlatformTenants';

// ── Retail V1 Pages ──────────────────────────────
import RetailShell from './retail/RetailShell';
import RetailHome from './retail/RetailHome';
import RetailNewBill from './retail/RetailNewBill';
import RetailPayment from './retail/RetailPayment';
import RetailSaleComplete from './retail/RetailSaleComplete';
import RetailItems from './retail/RetailItems';
import RetailAddItem from './retail/RetailAddItem';
import RetailKhata from './retail/RetailKhata';
import RetailKhataDetail from './retail/RetailKhataDetail';
import RetailReceivePayment from './retail/RetailReceivePayment';
import RetailMore from './retail/RetailMore';
import RetailNeeds from './retail/RetailNeeds';
import RetailSuppliers from './retail/RetailSuppliers';
import RetailSupplierKhata from './retail/RetailSupplierKhata';
import RetailPaySupplier from './retail/RetailPaySupplier';
import RetailPurchases from './retail/RetailPurchases';
import RetailAddPurchase from './retail/RetailAddPurchase';

/**
 * Route guard: requires authentication.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionId = useAuthStore((state) => state.session_id);
  if (!sessionId) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/**
 * Route guard: requires platform admin role.
 */
const PlatformGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  if (!user?.is_platform) return <Navigate to="/retail" replace />;
  return <>{children}</>;
};

/**
 * Route guard: requires tenant (non-platform) user.
 */
const TenantGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  if (user?.is_platform) return <Navigate to="/platform/dashboard" replace />;
  return <>{children}</>;
};

/**
 * Route guard: requires tenant admin role or appropriate permissions.
 */
const MasterAdminGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const role = (user as any)?.role;
  if (role !== 'ADMIN' && !user?.is_platform) {
    return <Navigate to="/retail/home" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public ──────────────────────────────────── */}
        <Route path="/login" element={<Login />} />

        {/* ── Platform Admin Routes ──────────────────── */}
        <Route
          path="/platform"
          element={
            <ProtectedRoute>
              <PlatformGuard>
                <PlatformShell />
              </PlatformGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/platform/dashboard" replace />} />
          <Route path="dashboard" element={<PlatformDashboard />} />
          <Route path="tenants" element={<PlatformTenants />} />
        </Route>

        {/* ── Retail V1 Routes (Mobile First) ────────── */}
        <Route
          path="/retail"
          element={
            <ProtectedRoute>
              <TenantGuard>
                <RetailShell />
              </TenantGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/retail/home" replace />} />
          <Route path="home" element={<RetailHome />} />
          <Route path="bill" element={<RetailNewBill />} />
          <Route path="payment" element={<RetailPayment />} />
          <Route path="sale-complete" element={<RetailSaleComplete />} />
          <Route path="items" element={<RetailItems />} />
          <Route path="items/add" element={<RetailAddItem />} />
          <Route path="khata" element={<RetailKhata />} />
          <Route path="khata/:id" element={<RetailKhataDetail />} />
          <Route path="receive-payment" element={<RetailReceivePayment />} />
          <Route path="more" element={<RetailMore />} />
          
          {/* Phase 2 Routes */}
          <Route path="needs" element={<RetailNeeds />} />
          <Route path="suppliers" element={<RetailSuppliers />} />
          <Route path="suppliers/:id" element={<RetailSupplierKhata />} />
          <Route path="suppliers/:id/pay" element={<RetailPaySupplier />} />
          <Route path="purchases" element={<RetailPurchases />} />
          <Route path="purchases/new" element={<RetailAddPurchase />} />
          
          {/* Fallbacks for missing feature pages */}
          <Route path="more/*" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Coming Soon</h2>
              <p>This feature will be available in upcoming updates.</p>
            </div>
          } />
        </Route>

        {/* ── Tenant Admin/Master Setup Routes ────────── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TenantGuard>
                <MasterAdminGuard>
                  <TenantShell />
                </MasterAdminGuard>
              </TenantGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/retail/home" replace />} />
          
          {/* Masters */}
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="companies" element={<Companies />} />
          <Route path="branches" element={<Branches />} />
          <Route path="godowns" element={<Godowns />} />
          <Route path="financial-years" element={<FinancialYears />} />

          {/* Inventory Module Config */}
          <Route path="inventory/stock" element={<StockSummary />} />
          <Route path="inventory/movements" element={<StockMovements />} />
          <Route path="inventory/adjustments" element={<StockAdjustments />} />
          <Route path="inventory/transfers" element={<StockTransfers />} />
          <Route path="inventory/barcodes" element={<BarcodeLabels />} />

          {/* Accounting Module Config */}
          <Route path="accounting/accounts" element={<ChartOfAccounts />} />
          <Route path="accounting/ledger/:id" element={<Ledger />} />
          <Route path="accounting/banks" element={<BankAccounts />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/retail/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
