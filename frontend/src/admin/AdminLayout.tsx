import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminLayout(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <p className="admin-brand-kicker">QUOKKA</p>
          <h1>Admin</h1>
          <p>Gestion claire et rapide</p>
        </div>

        <nav className="admin-nav admin-nav-horizontal">
          <NavLink to="/admin/users">Utilisateurs</NavLink>
          <NavLink to="/admin/servers">Serveurs</NavLink>
          <NavLink to="/admin/subscriptions">Abonnements</NavLink>
          <NavLink to="/admin/tickets">Tickets</NavLink>
          <NavLink to="/admin/warnings">Avertissements</NavLink>
          <NavLink to="/admin/manual-activation">Activation manuelle</NavLink>
          <NavLink to="/admin/promo-codes">Codes promo</NavLink>
          <NavLink to="/admin/settings">Paramétrage</NavLink>
        </nav>

        <div className="admin-user-bar">
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
      </header>

      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}
