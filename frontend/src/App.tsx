import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { useAuth } from "./context/AuthContext";
import { AddServerPage } from "./pages/AddServerPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { OffersPage } from "./pages/OffersPage";
import { OrderThankYouPage } from "./pages/OrderThankYouPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ServerPage } from "./pages/ServerPage";
import { SsoAuthentikPage } from "./pages/SsoAuthentikPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { Verify2FAPage } from "./pages/Verify2FAPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminUsersPage } from "./admin/AdminUsersPage";
import { AdminUserDetailsPage } from "./admin/AdminUserDetailsPage";
import { AdminServersPage } from "./admin/AdminServersPage";
import { AdminSettingsPage } from "./admin/AdminSettingsPage";
import { AdminSubscriptionsPage } from "./admin/AdminSubscriptionsPage";
import { AdminManualActivationPage } from "./admin/AdminManualActivationPage";
import { AdminPromoCodesPage } from "./admin/AdminPromoCodesPage";

function PrivateRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App(): JSX.Element {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

    let cancelled = false;
    void fetch(`${API_URL}/maintenance`)
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          maintenance?: { is_enabled?: boolean };
        };
        if (!cancelled) {
          setMaintenanceEnabled(Boolean(data.maintenance?.is_enabled));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMaintenanceEnabled(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (maintenanceEnabled) {
    return (
      <div className="app-shell">
        <MaintenancePage />
        <Footer />
      </div>
    );
  }

  return (
    <div className={`app-shell ${isAdminArea ? "app-shell-admin" : ""}`}>
      {!isAdminArea && <EmailVerificationBanner />}
      {!isAdminArea && <Header variant="home" />}
      <main className={isAdminArea ? "main-content admin-main-content" : "main-content"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-2fa" element={<Verify2FAPage />} />
          <Route path="/sso/authentik" element={<SsoAuthentikPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-server"
            element={
              <PrivateRoute>
                <AddServerPage />
              </PrivateRoute>
            }
          />
          <Route path="/servers/:serverId" element={<ServerPage />} />
          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route
            path="/subscriptions"
            element={
              <PrivateRoute>
                <SubscriptionsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/offers"
            element={
              <PrivateRoute>
                <OffersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/order/thank-you"
            element={
              <PrivateRoute>
                <OrderThankYouPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId" element={<AdminUserDetailsPage />} />
            <Route path="servers" element={<AdminServersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="manual-activation" element={<AdminManualActivationPage />} />
            <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
