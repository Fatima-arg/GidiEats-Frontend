import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import type { Role } from '../api/types';

export function RequireAuth({ children }: { children: React.ReactElement }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function roleHome(role?: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'RESTAFF':
      return '/staff';
    case 'RIDER':
      return '/rider';
    case 'CUSTOMER':
      return '/';
    default:
      return '/';
  }
}

export function RequireRole({ role, roles, children }: { role?: Role; roles?: Role[]; children: React.ReactElement }) {
  const { user } = useAuth();
  const allowed = roles ?? (role ? [role] : []);
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={roleHome(user?.role)} replace />;
  }
  return children;
}