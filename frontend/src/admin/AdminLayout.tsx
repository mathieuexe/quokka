import { Link, NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

export function AdminLayout(): JSX.Element {
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let timer: number | null = null;
    async function load(): Promise<void> {
      if (!token) return;
      try {
        const data = await apiRequest<{ notifications: any[]; unreadCount: number }>(`/admin/notifications?onlyUnread=true&limit=1`, { token });
        setUnreadCount(data.unreadCount ?? 0);
      } catch {
        setUnreadCount(0);
      }
    }
    void load();
    timer = window.setInterval(() => void load(), 20000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [token]);

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <p className="admin-brand-kicker">QUOKKA</p>
          <h1>Admin</h1>
          <p>Gestion claire et rapide</p>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <span className="admin-nav-title">Gestion</span>
            <NavLink to="/admin/users">Utilisateurs</NavLink>
            <NavLink to="/admin/servers">Serveurs</NavLink>
            <NavLink to="/admin/subscriptions">Abonnements</NavLink>
            <NavLink to="/admin/tickets">Tickets</NavLink>
          </div>
          <div className="admin-nav-section">
            <span className="admin-nav-title">Outils</span>
            <NavLink to="/admin/warnings">Avertissements</NavLink>
            <NavLink to="/admin/notifications">
              Notifications
              {unreadCount > 0 && (
                <span
                  className="tag"
                  style={{
                    marginLeft: "0.5rem",
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    borderColor: "transparent"
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/admin/manual-activation">Activation manuelle</NavLink>
            <NavLink to="/admin/promo-codes">Codes promo</NavLink>
            <NavLink to="/admin/blog">Blog</NavLink>
            <NavLink to="/admin/settings">Paramétrage</NavLink>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <p>
            Connecté : <strong>{user?.pseudo}</strong>
          </p>
          <div className="admin-user-actions">
            <Link className="btn btn-ghost" to="/">
              Retour au site
            </Link>
            <button className="btn btn-ghost" type="button" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-content">
        <div className="admin-content-inner">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
