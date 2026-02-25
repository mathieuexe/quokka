import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { ChevronDown, CreditCard, LifeBuoy, LogOut, Menu, ShieldCheck, User, X, Zap } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "https://quokka.gg/api";

type HeaderProps = {
  variant?: "default" | "home";
};

export function Header({ variant = "default" }: HeaderProps): JSX.Element {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  function warmRoute(target: "dashboard" | "chat" | "addServer" | "tickets" | "adminLayout"): void {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    };
    const run = () => {
      if (target === "dashboard") {
        void import("../pages/DashboardPage");
      } else if (target === "chat") {
        void import("../pages/ChatPage");
      } else if (target === "addServer") {
        void import("../pages/AddServerPage");
      } else if (target === "tickets") {
        void import("../pages/TicketsPage");
      } else if (target === "adminLayout") {
        void import("../admin/AdminLayout");
      }
    };
    if (typeof win.requestIdleCallback === "function") {
      win.requestIdleCallback(run, { timeout: 1500 });
    } else {
      window.setTimeout(run, 500);
    }
  }

  const navItems = useMemo(() => {
    const base = [
      { to: "/", label: t("nav.home"), warm: () => warmRoute("dashboard") },
      { to: "/chat", label: t("nav.liveChat"), warm: () => warmRoute("chat") },
      { to: "/add-server", label: t("nav.addServer"), warm: () => warmRoute("addServer") }
    ];
    if (isAuthenticated) {
      base.push({ to: "/tickets", label: t("nav.support"), warm: () => warmRoute("tickets") });
    }
    if (isAdmin) {
      base.push({ to: "/admin", label: t("nav.adminPanel"), warm: () => warmRoute("adminLayout") });
    }
    return base;
  }, [isAdmin, isAuthenticated, t]);

  function closeMenus(): void {
    setProfileOpen(false);
    setMobileOpen(false);
  }

  function handleLogout(): void {
    closeMenus();
    logout();
  }

  return (
    <header className={`site-header ${variant === "home" ? "site-header--home" : ""}`}>
      <div className="site-header-inner">
        <div className="site-header-left">
          <Link to="/" className="site-header-brand" onClick={closeMenus} aria-label={t("header.ariaHome")}>
            <img className="site-header-logo" src="/images/logo/logorond.png" alt="" aria-hidden="true" />
            <span className="site-header-brand-text">
              <strong>Quokka</strong>
              <span>{t("header.tagline")}</span>
            </span>
          </Link>
        </div>

        <nav className="site-header-tabs" aria-label={t("header.mainMenu")}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={item.warm}
              onFocus={item.warm}
              onClick={closeMenus}
              className={({ isActive }) => `site-header-tab ${isActive ? "is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-right">
          <NavLink to="/subscriptions" onClick={closeMenus} className="site-header-upgrade">
            <Zap size={16} />
            <span>{t("header.upgrade")}</span>
          </NavLink>

          {isAuthenticated ? (
            <div className="site-header-profile">
              <button
                className={`site-header-avatar-btn ${profileOpen ? "is-open" : ""}`}
                type="button"
                aria-label={t("header.openProfileMenu")}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((current) => !current)}
              >
                {user?.avatar_url ? (
                  <img className="site-header-avatar" src={user.avatar_url} alt={t("header.avatarAlt", { pseudo: user.pseudo })} />
                ) : (
                  <span className="site-header-avatar site-header-avatar-fallback" aria-hidden="true">
                    {user?.pseudo?.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <ChevronDown className="site-header-avatar-chevron" size={16} />
              </button>

              {profileOpen && (
                <div className="site-header-dropdown" role="menu">
                  <Link to="/dashboard" onClick={closeMenus} className="site-header-dropdown-item" role="menuitem">
                    <User size={18} />
                    <span>{t("nav.profile")}</span>
                  </Link>
                  <Link to="/subscriptions" onClick={closeMenus} className="site-header-dropdown-item" role="menuitem">
                    <CreditCard size={18} />
                    <span>{t("nav.subscriptions")}</span>
                  </Link>
                  <Link to="/tickets" onClick={closeMenus} className="site-header-dropdown-item" role="menuitem">
                    <LifeBuoy size={18} />
                    <span>{t("nav.support")}</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={closeMenus} className="site-header-dropdown-item" role="menuitem">
                      <ShieldCheck size={18} />
                      <span>{t("nav.adminPanel")}</span>
                    </Link>
                  )}
                  <button className="site-header-dropdown-item site-header-dropdown-logout" type="button" onClick={handleLogout} role="menuitem">
                    <LogOut size={18} />
                    <span>{t("common.logout")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="site-header-auth">
              <NavLink to="/login" onClick={closeMenus} className="site-header-auth-link">
                {t("auth.login")}
              </NavLink>
            </div>
          )}

          <button
            className="site-header-burger"
            type="button"
            aria-label={mobileOpen ? t("header.closeMenu") : t("header.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="site-header-mobile-overlay" role="presentation" onClick={closeMenus}>
          <div className="site-header-mobile-drawer" role="dialog" aria-label={t("header.menu")} onClick={(event) => event.stopPropagation()}>
            <nav className="site-header-mobile-nav" aria-label={t("header.navigation")}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onMouseEnter={item.warm}
                  onFocus={item.warm}
                  onClick={closeMenus}
                  className="site-header-mobile-link"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="site-header-mobile-actions">
              <NavLink to="/subscriptions" onClick={closeMenus} className="site-header-mobile-upgrade">
                <Zap size={16} />
                <span>{t("header.upgrade")}</span>
              </NavLink>

              {isAuthenticated ? (
                <button className="site-header-mobile-logout" type="button" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>{t("common.logout")}</span>
                </button>
              ) : (
                <div className="site-header-mobile-auth">
                  <NavLink to="/login" onClick={closeMenus} className="site-header-mobile-auth-link">
                    {t("auth.login")}
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
