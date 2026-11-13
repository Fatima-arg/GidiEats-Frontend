import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/auth';
import { RequireAuth, RequireRole, roleHome } from './components/Protected';
import { PublicLayout } from './components/PublicLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { CustomerLayout } from './pages/customer/CustomerLayout';
import { BrowsePage } from './pages/customer/BrowsePage';
import { RestaurantPage } from './pages/customer/RestaurantPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { TrackPage } from './pages/customer/TrackPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { StaffLayout } from './pages/staff/StaffLayout';
import { StaffDashboard } from './pages/staff/DashboardPage';
import { StaffOrders } from './pages/staff/OrdersPage';
import { StaffMenu } from './pages/staff/MenuPage';
import { StaffDeliveries } from './pages/staff/DeliveriesPage';
import { RiderLayout } from './pages/rider/RiderLayout';
import { RiderDashboard } from './pages/rider/DashboardPage';
import { RiderDeliveries } from './pages/rider/DeliveriesPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/DashboardPage';
import { AdminRestaurants } from './pages/admin/RestaurantsPage';
import { AdminUsers } from './pages/admin/UsersPage';
import { AdminReports } from './pages/admin/ReportsPage';
import { AdminPayments } from './pages/admin/PaymentsPage';

// Public storefront home: shows the restaurant grid to everyone. Logged-in
// staff/rider/admin are still routed to their own workspaces.
function Home() {
  const { user } = useAuth();
  if (user && user.role !== 'CUSTOMER') {
    return <Navigate to={roleHome(user.role)} replace />;
  }
  return (
    <PublicLayout>
      <BrowsePage />
    </PublicLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public storefront: browsing, menu and checkout work without an account */}
      <Route
        path="/restaurants/:id"
        element={
          <PublicLayout>
            <RestaurantPage />
          </PublicLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <PublicLayout>
            <CheckoutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/track"
        element={
          <PublicLayout>
            <TrackPage />
          </PublicLayout>
        }
      />
      <Route
        path="/track/:orderNumber"
        element={
          <PublicLayout>
            <TrackPage />
          </PublicLayout>
        }
      />

      {/* Logged-in customer area: order history, order detail, profile */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <RequireRole role="CUSTOMER">
              <CustomerLayout>
                <Outlet />
              </CustomerLayout>
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/staff"
        element={
          <RequireAuth>
            <RequireRole roles={['RESTAFF', 'ADMIN']}>
              <StaffLayout>
                <Outlet />
              </StaffLayout>
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<StaffDashboard />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="menu" element={<StaffMenu />} />
        <Route path="deliveries" element={<StaffDeliveries />} />
      </Route>

      <Route
        path="/rider"
        element={
          <RequireAuth>
            <RequireRole role="RIDER">
              <RiderLayout>
                <Outlet />
              </RiderLayout>
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<RiderDashboard />} />
        <Route path="deliveries" element={<RiderDeliveries />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireRole role="ADMIN">
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}