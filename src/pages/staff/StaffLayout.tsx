import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Bike } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';

const NAV = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/staff/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/staff/deliveries', label: 'Deliveries', icon: Bike }
];

export function StaffLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout nav={NAV}>{children}</DashboardLayout>;
}