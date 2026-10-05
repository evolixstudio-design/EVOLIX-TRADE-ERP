/**
 * EVOLIX Retail V1 — Mobile Shell with Bottom Navigation
 * 
 * Fixed bottom nav: Home | Bill | Items | Khata | More
 * Bill button is the most prominent (elevated green circle).
 */
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import {
  Home, Package, BookOpen, MoreHorizontal, Plus
} from 'lucide-react';
import { useAuthStore } from '../shared/store/authStore';
import '../retail/retail.css';

const RetailShell = () => {
  const user = useAuthStore((s) => s.user);

  if (user?.is_platform) {
    return <Navigate to="/platform/dashboard" replace />;
  }

  return (
    <div className="retail-app">
      <div className="r-shell">
        {/* Page Content */}
        <div className="r-page" id="retail-page-content">
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <nav className="r-bottom-nav" id="retail-bottom-nav">
          <NavLink
            to="/retail/home"
            className={({ isActive }) => `r-nav-item ${isActive ? 'active' : ''}`}
            id="nav-home"
          >
            <Home />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/retail/bill"
            className={({ isActive }) => `r-nav-item r-nav-item--bill ${isActive ? 'active' : ''}`}
            id="nav-bill"
          >
            <div className="r-nav-bill-icon">
              <Plus />
            </div>
            <span>Bill</span>
          </NavLink>

          <NavLink
            to="/retail/items"
            className={({ isActive }) => `r-nav-item ${isActive ? 'active' : ''}`}
            id="nav-items"
          >
            <Package />
            <span>Items</span>
          </NavLink>

          <NavLink
            to="/retail/khata"
            className={({ isActive }) => `r-nav-item ${isActive ? 'active' : ''}`}
            id="nav-khata"
          >
            <BookOpen />
            <span>Khata</span>
          </NavLink>

          <NavLink
            to="/retail/more"
            className={({ isActive }) => `r-nav-item ${isActive ? 'active' : ''}`}
            id="nav-more"
          >
            <MoreHorizontal />
            <span>More</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default RetailShell;
