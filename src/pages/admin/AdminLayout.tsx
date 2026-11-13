import { LayoutDashboard, Store, Users, BarChart3, CreditCard } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/payments', label: 'Payments Audit', icon: CreditCard },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 }
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout nav={NAV}>{children}</DashboardLayout>;
}