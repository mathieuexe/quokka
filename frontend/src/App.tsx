import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { useAuth } from "./context/AuthContext";
import { AddServerPage } from "./pages/AddServerPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DiscordCallbackPage } from "./pages/DiscordCallbackPage";
import { DiscordSuccess } from "./pages/auth/DiscordSuccess";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { LegalNoticePage } from "./pages/LegalNoticePage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { OffersPage } from "./pages/OffersPage";
import { OrderThankYouPage } from "./pages/OrderThankYouPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ServerPage } from "./pages/ServerPage";
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
import { AdminWarningsPage } from "./admin/AdminWarningsPage";

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://quokka.gg";
const DEFAULT_TITLE = "Quokka — Annuaire et classement de serveurs Discord & gaming";
const DEFAULT_DESCRIPTION =
  "Annuaire serveur Discord et gaming pour trouver, ajouter et promouvoir un serveur. Classement, top serveur Discord, communautés actives, serveurs RP, FiveM, Minecraft, GMod, Fortnite, Arma et Stoat.";
const DEFAULT_IMAGE = `${SITE_URL}/images/logo/logorond.png`;
const NOINDEX_PATHS = [
  "/auth/discord/callback",
  "/auth/discord/success",
  "/login",
  "/register",
  "/verify-email",
  "/verify-2fa",
  "/dashboard",
  "/subscriptions",
  "/offers",
  "/order/thank-you",
  "/add-server"
];

type SeoData = {
  title: string;
  description: string;
  robots: string;
  canonical: string;
};

function resolveSeo(pathname: string): SeoData {
  const canonical = new URL(pathname, SITE_URL).toString();
  const noindex = pathname.startsWith("/admin") || NOINDEX_PATHS.some((path) => pathname.startsWith(path));
  const robots = noindex ? "noindex, nofollow" : "index, follow";

  if (pathname === "/") {
    return {
      title: DEFAULT_TITLE,
      description:
        "Annuaire serveur Discord et gaming: liste, top et classement pour trouver un serveur Discord français, ajouter un serveur Discord gratuitement et promouvoir votre communauté.",
      robots,
      canonical
    };
  }

  if (pathname.startsWith("/servers/")) {
    return {
      title: "Fiche serveur Discord & gaming | Quokka",
      description:
        "Découvrez la fiche d’un serveur Discord, son classement, ses statistiques et rejoignez sa communauté.",
      robots,
      canonical
    };
  }

  if (pathname.startsWith("/users/")) {
    return {
      title: "Profil communauté Discord | Quokka",
      description:
        "Explorez le profil d’un créateur, ses serveurs et sa communauté gaming.",
      robots,
      canonical
    };
  }

  if (pathname === "/chat") {
    return {
      title: "Chat communautaire Discord | Quokka",
      description:
        "Discutez avec la communauté Quokka et découvrez des serveurs Discord actifs.",
      robots,
      canonical
    };
  }

  if (pathname === "/mentions-legales") {
    return {
      title: "Mentions légales | Quokka",
      description:
        "Informations légales, hébergeur, propriété intellectuelle et cookies du site Quokka.",
      robots,
      canonical
    };
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, robots, canonical };
}

function setMetaTag(name: string, content: string): void {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string): void {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

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
  const betaVersion = "v1.2";
  const betaMessageLine1 = `Quokka est en phase de bêta ouverte ${betaVersion}. Certaines fonctionnalités peuvent être instables.`;
  const betaMessageLine2 =
    "Inscrivez-vous à la bêta publique sur notre serveur Stoat afin de nous faire part de vos retours et améliorer la plateforme.";

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://quokka.gg/api";

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

  useEffect(() => {
    const seo = resolveSeo(location.pathname);
    document.title = seo.title;
    setMetaTag("description", seo.description);
    setMetaTag("robots", seo.robots);
    setMetaProperty("og:title", seo.title);
    setMetaProperty("og:description", seo.description);
    setMetaProperty("og:url", seo.canonical);
    setMetaProperty("og:image", DEFAULT_IMAGE);
    setMetaProperty("og:site_name", "Quokka");
    setMetaProperty("og:type", "website");
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", seo.title);
    setMetaTag("twitter:description", seo.description);
    setMetaTag("twitter:image", DEFAULT_IMAGE);

    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.setAttribute("href", seo.canonical);
    } else {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", seo.canonical);
      document.head.appendChild(link);
    }
  }, [location.pathname]);

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
      {!isAdminArea && (
        <div className="site-header-announcement" role="status" aria-live="polite">
          <div className="site-header-announcement-track">
            <span className="site-header-announcement-message">
              <span>{betaMessageLine1}</span>
              <span>{betaMessageLine2}</span>
            </span>
            <a className="site-header-announcement-btn" href="https://stt.gg/PdFsKC2w" target="_blank" rel="noreferrer">
              Rejoindre Stoat
            </a>
          </div>
        </div>
      )}
      {!isAdminArea && <EmailVerificationBanner />}
      {!isAdminArea && <Header variant="home" />}
      <main className={isAdminArea ? "main-content admin-main-content" : "main-content"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />
          <Route path="/auth/discord/success" element={<DiscordSuccess />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mentions-legales" element={<LegalNoticePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-2fa" element={<Verify2FAPage />} />
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
            <Route path="warnings" element={<AdminWarningsPage />} />
            <Route path="manual-activation" element={<AdminManualActivationPage />} />
            <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
