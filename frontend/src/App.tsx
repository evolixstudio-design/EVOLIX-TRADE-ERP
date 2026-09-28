
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Sessions from './pages/Sessions';
import Organizations from './pages/Organizations';
import Companies from './pages/Companies';
import Branches from './pages/Branches';
import Godowns from './pages/Godowns';
import FinancialYears from './pages/FinancialYears';
import Intelligence from './pages/Intelligence';
import Shell from './components/Shell';
import PurchaseDashboard from './pages/Purchasing/PurchaseDashboard';
import PurchaseOrders from './pages/Purchasing/PurchaseOrders';
import PurchaseOrderCreate from './pages/Purchasing/PurchaseOrderCreate';
import PurchaseOrderDetail from './pages/Purchasing/PurchaseOrderDetail';
import ChartOfAccounts from './pages/Accounting/ChartOfAccounts';
import Ledger from './pages/Accounting/Ledger';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionId = useAuthStore((state: any) => state.session_id);
  if (!sessionId) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="companies" element={<Companies />} />
          <Route path="branches" element={<Branches />} />
          <Route path="godowns" element={<Godowns />} />
          <Route path="financial-years" element={<FinancialYears />} />
          <Route path="intelligence" element={<Intelligence />} />
          
          {/* Purchasing Module */}
          <Route path="purchasing" element={<PurchaseDashboard />} />
          <Route path="purchasing/orders" element={<PurchaseOrders />} />
          <Route path="purchasing/orders/new" element={<PurchaseOrderCreate />} />
          <Route path="purchasing/orders/:id" element={<PurchaseOrderDetail />} />
          
          {/* Accounting Module */}
          <Route path="accounting/accounts" element={<ChartOfAccounts />} />
          <Route path="accounting/ledger/:id" element={<Ledger />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

