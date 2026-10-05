import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  roles: any[];
  permissions: string[];
  is_platform?: boolean;
  organization_id?: string;
  organization_name?: string;
}

export interface TenantContext {
  organization_id: string;
  organization_name: string;
  company_id: string;
  company_name: string;
  branch_id: string;
  branch_name: string;
  financial_year_id?: string;
  financial_year_label?: string;
}

interface AuthState {
  session_id: string | null;
  user: User | null;
  tenantContext: TenantContext | null;
  login: (session_id: string, user: User) => void;
  logout: () => void;
  setTenantContext: (ctx: TenantContext) => void;
  setCompany: (id: string, name: string) => void;
  setBranch: (id: string, name: string) => void;
  setFinancialYear: (id: string, label: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session_id: null,
      user: null,
      tenantContext: null,
      login: (session_id, user) => set({ session_id, user }),
      logout: () => {
        set({ session_id: null, user: null, tenantContext: null });
        window.location.href = '/login';
      },
      setTenantContext: (ctx) => set({ tenantContext: ctx }),
      setCompany: (id, name) =>
        set((state) => ({
          tenantContext: state.tenantContext
            ? { ...state.tenantContext, company_id: id, company_name: name }
            : null,
        })),
      setBranch: (id, name) =>
        set((state) => ({
          tenantContext: state.tenantContext
            ? { ...state.tenantContext, branch_id: id, branch_name: name }
            : null,
        })),
      setFinancialYear: (id, label) =>
        set((state) => ({
          tenantContext: state.tenantContext
            ? { ...state.tenantContext, financial_year_id: id, financial_year_label: label }
            : null,
        })),
    }),
    {
      name: 'evolix-auth',
    }
  )
);
