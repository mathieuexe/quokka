import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { useAuth } from "./context/AuthContext";
import { AnnouncementSettings, SiteBrandingSettings, getPublicAnnouncementSettings, getPublicBrandingSettings } from "./lib/api";
import { MaintenanceBanner } from "./components/MaintenanceBanner";
import { PageLoader } from "./components/ui/PageLoader";

// === Core & Public Pages ===
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const LegalNoticePage = lazy(() => import("./pages/LegalNoticePage").then((module) => ({ default: module.LegalNoticePage })));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage").then((module) => ({ default: module.MaintenancePage })));
const ChatPage = lazy(() => import("./pages/ChatPage").then((module) => ({ default: module.ChatPage })));

// === Authentication Pages ===
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage").then((module) => ({ default: module.VerifyEmailPage })));
const Verify2FAPage = lazy(() => import("./pages/Verify2FAPage").then((module) => ({ default: module.Verify2FAPage })));
const DiscordCallbackPage = lazy(() => import("./pages/DiscordCallbackPage").then((module) => ({ default: module.DiscordCallbackPage })));
const DiscordSuccess = lazy(() => import("./pages/auth/DiscordSuccess").then((module) => ({ default: module.DiscordSuccess })));

// === User & Entity Pages ===
const UserProfilePage = lazy(() => import("./pages/UserProfilePage").then((module) => ({ default: module.UserProfilePage })));
const ServerPage = lazy(() => import("./pages/ServerPage").then((module) => ({ default: module.ServerPage })));
const AddServerPage = lazy(() => import("./pages/AddServerPage").then((module) => ({ default: module.AddServerPage })));

// === Dashboard & Commerce Pages ===
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage").then((module) => ({ default: module.SubscriptionsPage })));
const TicketsPage = lazy(() => import("./pages/TicketsPage").then((module) => ({ default: module.TicketsPage })));
const OffersPage = lazy(() => import("./pages/OffersPage").then((module) => ({ default: module.OffersPage })));
const OrderThankYouPage = lazy(() => import("./pages/OrderThankYouPage").then((module) => ({ default: module.OrderThankYouPage })));

// === Blog Pages ===
const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage").then((module) => ({ default: module.BlogIndexPage })));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage").then((module) => ({ default: module.BlogPostPage })));

// === Admin Pages ===
const AdminLayout = lazy(() => import("./admin/AdminLayout").then((module) => ({ default: module.AdminLayout })));
const AdminUsersPage = lazy(() => import("./admin/AdminUsersPage").then((module) => ({ default: module.AdminUsersPage })));
const AdminUserDetailsPage = lazy(() => import("./admin/AdminUserDetailsPage").then((module) => ({ default: module.AdminUserDetailsPage })));
const AdminServersPage = lazy(() => import("./admin/AdminServersPage").then((module) => ({ default: module.AdminServersPage })));
const AdminCertificationsPage = lazy(() => import("./admin/AdminCertificationsPage").then((module) => ({ default: module.AdminCertificationsPage })));
const AdminSettingsPage = lazy(() => import("./admin/AdminSettingsPage").then((module) => ({ default: module.AdminSettingsPage })));
const AdminSubscriptionsPage = lazy(() => import("./admin/AdminSubscriptionsPage").then((module) => ({ default: module.AdminSubscriptionsPage })));
const AdminTicketsPage = lazy(() => import("./admin/AdminTicketsPage").then((module) => ({ default: module.AdminTicketsPage })));
const AdminManualActivationPage = lazy(() => import("./admin/AdminManualActivationPage").then((module) => ({ default: module.AdminManualActivationPage })));
const AdminPromoCodesPage = lazy(() => import("./admin/AdminPromoCodesPage").then((module) => ({ default: module.AdminPromoCodesPage })));
const AdminWarningsPage = lazy(() => import("./admin/AdminWarningsPage").then((module) => ({ default: module.AdminWarningsPage })));
const AdminNotificationsPage = lazy(() => import("./admin/AdminNotificationsPage").then((module) => ({ default: module.AdminNotificationsPage })));
const AdminBlogPage = lazy(() => import("./admin/AdminBlogPage").then((module) => ({ default: module.AdminBlogPage })));

const preloaders = {
  dashboard: () => import("./pages/DashboardPage"),
  offers: () => import("./pages/OffersPage"),
  subscriptions: () => import("./pages/SubscriptionsPage"),
  tickets: () => import("./pages/TicketsPage"),
  addServer: () => import("./pages/AddServerPage"),
  chat: () => import("./pages/ChatPage"),
  login: () => import("./pages/LoginPage"),
  register: () => import("./pages/RegisterPage"),
  adminLayout: () => import("./admin/AdminLayout"),
  adminUsers: () => import("./admin/AdminUsersPage"),
  adminServers: () => import("./admin/AdminServersPage"),
  adminCertifications: () => import("./admin/AdminCertificationsPage"),
  adminTickets: () => import("./admin/AdminTicketsPage"),
  adminSubscriptions: () => import("./admin/AdminSubscriptionsPage"),
  adminSettings: () => import("./admin/AdminSettingsPage"),
  adminNotifications: () => import("./admin/AdminNotificationsPage"),
  adminBlog: () => import("./admin/AdminBlogPage")
};

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
  "/tickets",
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

const announcementIcons: Record<string, string> = {
  sparkles: "✨",
  megaphone: "📣",
  rocket: "🚀",
  warning: "⚠️",
  gift: "🎁",
  bell: "🔔"
};

function schedulePreload(callback: () => void): void {
  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
  };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(callback, { timeout: 800 });
    return;
  }
  window.setTimeout(callback, 300);
}

function resolveSeo(pathname: string, branding?: SiteBrandingSettings | null): SeoData {
  const canonical = new URL(pathname, SITE_URL).toString();
  const noindex = pathname.startsWith("/admin") || NOINDEX_PATHS.some((path) => pathname.startsWith(path));
  const robots = noindex ? "noindex, nofollow" : "index, follow";
  const brandTitle = branding?.site_title?.trim() || DEFAULT_TITLE;
  const brandDescription = branding?.site_description?.trim() || DEFAULT_DESCRIPTION;

  if (pathname === "/") {
    return {
      title: brandTitle,
      description:
        branding?.site_description?.trim() ||
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
      title: `Mentions légales | ${brandTitle}`,
      description:
        "Informations légales, hébergeur, propriété intellectuelle et cookies du site Quokka.",
      robots,
      canonical
    };
  }

  return { title: brandTitle, description: brandDescription, robots, canonical };
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

import { MaintenanceBanner } from "./components/MaintenanceBanner";

function setFavicon(url: string): void {
  const trimmed = url.trim();
  if (!trimmed) return;
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    document.head.appendChild(link);
  }
  link.setAttribute("href", trimmed);
}

function formatCountdown(target: string, nowMs: number): string | null {
  const targetMs = Date.parse(target);
  if (!target || Number.isNaN(targetMs)) return null;
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const dayPart = days > 0 ? `${days}j ` : "";
  const hourPart = `${hours}`.padStart(2, "0");
  const minutePart = `${minutes}`.padStart(2, "0");
  return `${dayPart}${hourPart}h ${minutePart}m`;
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
  const [showMaintenanceBanner, setShowMaintenanceBanner] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementSettings | null>(null);
  const [announcementNow, setAnnouncementNow] = useState(Date.now());
  const [branding, setBranding] = useState<SiteBrandingSettings | null>(null);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isAdminArea = location.pathname.startsWith("/admin");

  useEffect(() => {
    const envApiUrl = import.meta.env.VITE_API_URL;
    const rawApiUrl =
      envApiUrl && envApiUrl.trim()
        ? envApiUrl
        : typeof window !== "undefined"
          ? `${window.location.origin}/api`
          : "https://quokka.gg/api";
    const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
    const API_URL = /\/api(\/|$)/.test(normalizedApiUrl) ? normalizedApiUrl : `${normalizedApiUrl}/api`;

    let cancelled = false;
    void fetch(`${API_URL}/maintenance`)
      .then(async (response) => {
        if (response.headers.get("X-Maintenance-Mode") === "active-bypass") {
          setShowMaintenanceBanner(true);
        }
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
    let cancelled = false;
    void getPublicAnnouncementSettings()
      .then((data) => {
        if (!cancelled) {
          setAnnouncement(data.announcement);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnnouncement(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPublicBrandingSettings()
      .then((data) => {
        if (!cancelled) {
          setBranding(data.branding);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBranding(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!announcement?.countdown_target || !announcement.is_enabled) return;
    setAnnouncementNow(Date.now());
    const timer = window.setInterval(() => setAnnouncementNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [announcement?.countdown_target, announcement?.is_enabled]);

  useEffect(() => {
    const seo = resolveSeo(location.pathname, branding);
    const defaultImage = branding?.logo_url?.trim() || DEFAULT_IMAGE;
    document.title = seo.title;
    setMetaTag("description", seo.description);
    setMetaTag("robots", seo.robots);
    setMetaProperty("og:title", seo.title);
    setMetaProperty("og:description", seo.description);
    setMetaProperty("og:url", seo.canonical);
    setMetaProperty("og:image", defaultImage);
    setMetaProperty("og:site_name", branding?.site_title?.trim() || "Quokka");
    setMetaProperty("og:type", "website");
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", seo.title);
    setMetaTag("twitter:description", seo.description);
    setMetaTag("twitter:image", defaultImage);
    if (branding?.favicon_url?.trim()) {
      setFavicon(branding.favicon_url);
    }

    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.setAttribute("href", seo.canonical);
    } else {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", seo.canonical);
      document.head.appendChild(link);
    }
  }, [location.pathname, branding]);

  useEffect(() => {
    schedulePreload(() => {
      if (user?.role === "admin") {
        preloaders.adminLayout();
        preloaders.adminUsers();
        preloaders.adminServers();
        preloaders.adminCertifications();
        preloaders.adminTickets();
        preloaders.adminSubscriptions();
        preloaders.adminSettings();
        preloaders.adminNotifications();
        return;
      }
      if (isAuthenticated) {
        preloaders.dashboard();
        preloaders.offers();
        preloaders.subscriptions();
        preloaders.tickets();
        preloaders.addServer();
      } else {
        preloaders.login();
        preloaders.register();
      }
      if (location.pathname === "/") {
        preloaders.chat();
      }
    });
  }, [isAuthenticated, location.pathname, user?.role]);

  if (maintenanceEnabled && !showMaintenanceBanner) {
    return (
      <div className="app-shell">
        <Suspense fallback={<PageLoader />}>
          <MaintenancePage branding={branding} />
        </Suspense>
      </div>
    );
  }

  const announcementText = announcement?.text?.trim() ?? "";
  const announcementVisible = Boolean(announcement?.is_enabled && announcementText);
  const announcementIcon = announcement?.icon?.trim() ?? "";
  const announcementCountdown = announcement?.countdown_target
    ? formatCountdown(announcement.countdown_target, announcementNow)
    : null;
  const announcementCtaLabel = announcement?.cta_label?.trim() ?? "";
  const announcementCtaUrl = announcement?.cta_url?.trim() ?? "";
  const announcementToneByIcon: Record<string, string> = {
    warning: "alert",
    sparkles: "sparkles",
    megaphone: "announcement",
    rocket: "launch",
    gift: "offer",
    bell: "info"
  };
  const announcementTone = announcementToneByIcon[announcementIcon || "bell"] ?? "info";
  const announcementLine = announcementCountdown ? `${announcementText} • Fin dans ${announcementCountdown}` : announcementText;

  return (
    <div className={`app-shell ${isAdminArea ? "app-shell-admin" : ""}`}>
      {announcementVisible && (
        <div className={`site-header-announcement site-header-announcement--${announcementTone}`}>
          <div className="site-header-announcement-track">
            {announcementIcon && (
              <span className="site-header-announcement-icon">{announcementIcons[announcementIcon] ?? "ℹ️"}</span>
            )}
            <div className="site-header-announcement-message">
              <div className="site-header-announcement-marquee">
                <div className="site-header-announcement-marquee-track">
                  <span>{announcementLine}</span>
                  <span>{announcementLine}</span>
                </div>
              </div>
            </div>
            {announcementCtaLabel && announcementCtaUrl && (
              <a className="site-header-announcement-btn" href={announcementCtaUrl} target="_blank" rel="noreferrer">
                {announcementCtaLabel}
              </a>
            )}
          </div>
        </div>
      )}
      {showMaintenanceBanner && <MaintenanceBanner />}
      {!isAdminArea && <EmailVerificationBanner />}
      {!isAdminArea && <Header variant="home" branding={branding} />}
      <main className={isAdminArea ? "main-content admin-main-content" : "main-content"}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />
            <Route path="/api/auth/discord/callback" element={<DiscordCallbackPage />} />
            <Route path="/auth/discord/success" element={<DiscordSuccess />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mentions-legales" element={<LegalNoticePage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
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
              path="/tickets"
              element={
                <PrivateRoute>
                  <TicketsPage />
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
              <Route path="certifications" element={<AdminCertificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="tickets" element={<AdminTicketsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="warnings" element={<AdminWarningsPage />} />
              <Route path="manual-activation" element={<AdminManualActivationPage />} />
              <Route path="promo-codes" element={<AdminPromoCodesPage />} />
              <Route path="blog" element={<AdminBlogPage />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
