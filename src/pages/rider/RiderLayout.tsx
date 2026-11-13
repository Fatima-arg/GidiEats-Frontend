import { LayoutDashboard, Bike } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';

const NAV = [
  { to: '/rider', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/rider/deliveries', label: 'My deliveries', icon: Bike }
];

export function RiderLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout nav={NAV}>{children}</DashboardLayout>;
}