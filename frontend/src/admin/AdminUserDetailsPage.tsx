import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Server, User } from "../types";

type UserDetailsResponse = {
  user: User;
  servers: Server[];
};

export function AdminUserDetailsPage(): JSX.Element {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token, user: authUser } = useAuth();
  const { showToast } = useToast();
  const [details, setDetails] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadDetails(): Promise<void> {
      if (!token || !userId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<UserDetailsResponse>(`/admin/users/${userId}`, { token });
        setDetails(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger cet utilisateur.");
      } finally {
        setLoading(false);
      }
    }
    void loadDetails();
  }, [token, userId]);

  async function resendCode(type: "verification" | "2fa"): Promise<void> {
    if (!token || !userId) return;
    setSendingCode(true);
    try {
      await apiRequest<{ message: string }>("/admin/users/resend-code", {
        method: "POST",
        token,
        body: { userId, type }
      });
      showToast(type === "verification" ? "Code de vérification envoyé." : "Code 2FA envoyé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi du code impossible.");
    } finally {
      setSendingCode(false);
    }
  }

  async function deleteUser(): Promise<void> {
    if (!token || !details?.user) return;
    const target = details.user;
    const confirmation = window.prompt(
      `Suppression irréversible.\nTape "${target.pseudo}" pour confirmer la suppression de ce compte.`
    );
    if (confirmation !== target.pseudo) return;

    setDeleting(true);
    try {
      await apiRequest<{ message: string }>("/admin/users", {
        method: "DELETE",
        token,
        body: { userId: target.id }
      });
      showToast("Utilisateur supprimé.");
      navigate("/admin/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p>Chargement de la fiche utilisateur...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!details) return <p>Utilisateur introuvable.</p>;

  const target = details.user;
  const createdAt = target.created_at ? new Date(target.created_at).toLocaleString("fr-FR") : "N/A";

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Fiche utilisateur</h2>
        <p>Vue dédiée avec toutes les informations du compte et la liste de ses serveurs.</p>
      </div>

      <article className="card admin-user-card">
        <div>
          <h3>{target.pseudo}</h3>
          <p>{target.email}</p>
          <p>Créé le : {createdAt}</p>
        </div>
        <div className="admin-list-item-meta">
          <span className="tag">Rôle : {target.role}</span>
          <span className="tag">Langue : {(target.language ?? "fr").toUpperCase()}</span>
          {target.customer_reference && <span className="tag">Réf client : {target.customer_reference}</span>}
          <span className={`status-pill ${target.email_verified ? "status-paid" : "status-failed"}`}>
            {target.email_verified ? "Email vérifié" : "Email non vérifié"}
          </span>
          <span className={`status-pill ${target.two_factor_enabled ? "status-paid" : "status-pending"}`}>
            {target.two_factor_enabled ? "2FA activée" : "2FA désactivée"}
          </span>
        </div>
        <div>
          <h4>Badges</h4>
          {!target.badges || target.badges.length === 0 ? (
            <p>Aucun badge attribué.</p>
          ) : (
            <div className="user-badge-list">
              {target.badges.map((badge) => (
                <span key={badge.id} className="tag tag-with-icon">
                  <img className="user-badge-icon" src={badge.image_url} alt={`Badge ${badge.label}`} loading="lazy" />
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {target.bio && (
          <div>
            <h4>Bio</h4>
            <p>{target.bio}</p>
          </div>
        )}
        {target.internal_note && (
          <div>
            <h4>Note interne</h4>
            <p>{target.internal_note}</p>
          </div>
        )}

        <div className="server-card-actions">
          {!target.email_verified && (
            <button className="btn" type="button" disabled={sendingCode} onClick={() => void resendCode("verification")}>
              {sendingCode ? "Envoi..." : "Renvoyer le code email"}
            </button>
          )}
          <button className="btn btn-ghost" type="button" disabled={sendingCode} onClick={() => void resendCode("2fa")}>
            {sendingCode ? "Envoi..." : "Envoyer un code 2FA"}
          </button>
          {target.id !== authUser?.id && (
            <button className="btn btn-danger" type="button" disabled={deleting} onClick={() => void deleteUser()}>
              {deleting ? "Suppression..." : "Supprimer l'utilisateur"}
            </button>
          )}
        </div>
      </article>

      <article className="card">
        <h3>Serveurs de cet utilisateur</h3>
        {details.servers.length === 0 ? (
          <p>Aucun serveur enregistré.</p>
        ) : (
          <div className="admin-list-grid">
            {details.servers.map((server) => (
              <div key={server.id} className="admin-list-item static">
                <div>
                  <h3>{server.name}</h3>
                  <p>{server.category_label}</p>
                </div>
                <div className="admin-list-item-meta">
                  <span className="tag">Likes : {server.likes}</span>
                  <span className="tag">Vues : {server.views}</span>
                  <span className={`status-pill ${server.is_visible ? "status-paid" : "status-failed"}`}>
                    {server.is_visible ? "Visible" : "Masqué"}
                  </span>
                  <Link className="btn btn-ghost" to={`/servers/${server.id}`}>
                    Ouvrir la fiche serveur
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
