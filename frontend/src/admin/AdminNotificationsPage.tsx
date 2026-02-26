import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";

type AdminNotification = {
  id: string;
  type: "user_registered" | "server_added" | "ticket_opened" | "ticket_user_replied";
  priority: number;
  title: string;
  message: string | null;
  user_id: string | null;
  server_id: string | null;
  ticket_id: string | null;
  created_at: string;
  read_at: string | null;
};

type NotificationsResponse = {
  notifications: AdminNotification[];
  unreadCount: number;
};

export function AdminNotificationsPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<NotificationsResponse>(`/admin/notifications?onlyUnread=${unreadOnly}&limit=120`, { token });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token, unreadOnly]);

  async function markAllRead(): Promise<void> {
    if (!token) return;
    try {
      const result = await apiRequest<{ message: string; unreadCount: number }>(`/admin/notifications/read`, {
        method: "POST",
        token,
        body: { all: true }
      });
      showToast("Toutes les notifications ont été marquées comme lues.");
      setUnreadCount(result.unreadCount);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
    }
  }

  const title = useMemo(() => {
    return unreadOnly ? `Notifications (non lues: ${unreadCount})` : "Toutes les notifications";
  }, [unreadOnly, unreadCount]);

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <h2>{title}</h2>
        <p>Suivi temps réel : inscriptions, serveurs ajoutés, tickets ouverts et réponses clients.</p>
      </div>
      <div className="card">
        <div className="admin-topbar" style={{ padding: "0.6rem 0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <label className="inline-control">
              <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
              Afficher uniquement les non lues
            </label>
          </div>
          <div className="admin-actions">
            <button className="btn" type="button" onClick={() => void load()} disabled={loading}>
              {loading ? "Chargement..." : "Rafraîchir"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => void markAllRead()} disabled={loading || unreadCount === 0}>
              Tout marquer comme lu
            </button>
          </div>
        </div>
        {error && <p className="error-text" style={{ marginTop: "0.6rem" }}>{error}</p>}
        <div className="admin-list-grid" style={{ marginTop: "0.6rem" }}>
          {notifications.length === 0 ? (
            <p style={{ margin: "0.6rem" }}>Aucune notification.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="admin-list-item">
                <div className="admin-list-item-main">
                  <h3 style={{ margin: 0 }}>
                    {n.title}
                    {n.read_at === null && <span className="tag" style={{ marginLeft: "0.5rem" }}>Non lu</span>}
                  </h3>
                  {n.message && <p style={{ margin: "0.25rem 0 0", color: "var(--muted)" }}>{n.message}</p>}
                  <div className="admin-list-item-meta">
                    <span className="tag">Type: {n.type}</span>
                    <span className="tag">Priorité: {n.priority}</span>
                    <span className="tag">
                      {new Date(n.created_at).toLocaleDateString("fr-FR")}{" "}
                      {new Date(n.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {n.user_id && (
                      <Link to={`/admin/users/${n.user_id}`} className="btn btn-ghost">
                        Voir utilisateur
                      </Link>
                    )}
                    {n.server_id && (
                      <Link to={`/servers/${n.server_id}`} className="btn btn-ghost">
                        Voir serveur
                      </Link>
                    )}
                    {n.ticket_id && (
                      <Link to={`/admin/tickets?ticketId=${n.ticket_id}`} className="btn btn-ghost">
                        Ouvrir le ticket
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminNotificationsPage;
