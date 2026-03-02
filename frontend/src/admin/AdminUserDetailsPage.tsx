import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Badge, Server, User } from "../types";

type Ticket = {
  id: string;
  reference: string;
  user_id: string;
  user_pseudo: string;
  assigned_admin_id: string | null;
  assigned_admin_pseudo: string | null;
  status: string;
  priority: number;
  category: string;
  subcategory: string | null;
  created_at: string;
  last_message_at: string;
};

type TicketsResponse = {
  tickets: Ticket[];
};

type UserDetailsResponse = {
  user: User;
  servers: Server[];
  availableBadges: Badge[];
  subscriptions: Array<{
    id: string;
    server_id: string;
    server_name: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot: number | null;
  }>;
  emailEvents: Array<{
    type: "verification" | "2fa";
    created_at: string;
    expires_at: string;
    used: boolean;
  }>;
  ipEvents: Array<{
    id: string;
    event_type: "register" | "login" | "chat_message";
    ip: string;
    provider: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    chat_message_id: string | null;
    created_at: string;
  }>;
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
  const [sendingMail, setSendingMail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({
    pseudo: "",
    email: "",
    bio: "",
    internalNote: "",
    role: "user" as "user" | "admin"
  });
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [mailForm, setMailForm] = useState({
    subject: "",
    content: ""
  });
  const [activeTab, setActiveTab] = useState<"compte" | "serveurs" | "tickets" | "abonnements">("compte");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const isFakeAccount = Boolean(details?.user?.internal_note?.includes("[FAKE_DATA]"));

  const loadDetails = useCallback(async (): Promise<void> => {
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
  }, [token, userId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    if (!details?.user) return;
    setFormState({
      pseudo: details.user.pseudo ?? "",
      email: details.user.email ?? "",
      bio: details.user.bio ?? "",
      internalNote: details.user.internal_note ?? "",
      role: details.user.role ?? "user"
    });
    setSelectedBadges(details.user.badges?.map((badge) => badge.id) ?? []);
  }, [details]);

  useEffect(() => {
    async function loadTickets(): Promise<void> {
      if (!token || !userId) return;
      setTicketsLoading(true);
      setTicketsError(null);
      try {
        const result = await apiRequest<TicketsResponse>(`/admin/tickets?userId=${userId}`, { token });
        setTickets(result.tickets);
      } catch (e) {
        setTicketsError(e instanceof Error ? e.message : "Impossible de charger les tickets.");
      } finally {
        setTicketsLoading(false);
      }
    }
    if (activeTab === "tickets" && tickets.length === 0 && !ticketsLoading) {
      void loadTickets();
    }
  }, [activeTab, tickets.length, ticketsLoading, token, userId]);

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

  async function updateUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !details?.user) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/users", {
        method: "PATCH",
        token,
        body: {
          userId: details.user.id,
          pseudo: formState.pseudo.trim(),
          email: formState.email.trim(),
          bio: formState.bio,
          internalNote: formState.internalNote,
          role: formState.role,
          badgeIds: selectedBadges
        }
      });
      showToast("Utilisateur mis à jour.");
      await loadDetails();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function sendAdminMail(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !details?.user) return;
    setSendingMail(true);
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/users/send-mail", {
        method: "POST",
        token,
        body: {
          userId: details.user.id,
          subject: mailForm.subject.trim(),
          content: mailForm.content.trim()
        }
      });
      showToast("Email envoyé.");
      setMailForm({ subject: "", content: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi de l'email impossible.");
    } finally {
      setSendingMail(false);
    }
  }

  async function updateBalance(action: "credit" | "debit"): Promise<void> {
    if (!token || !details?.user) return;
    const normalized = balanceAmount.replace(",", ".");
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Montant invalide.");
      return;
    }
    setBalanceLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ balance_cents: number; message: string }>(
        `/admin/users/${details.user.id}/${action}-balance`,
        {
          method: "POST",
          token,
          body: { amountEuros: amount }
        }
      );
      setDetails((current) =>
        current
          ? {
              ...current,
              user: {
                ...current.user,
                balance_cents: response.balance_cents,
                last_balance_update: new Date().toISOString()
              }
            }
          : current
      );
      setBalanceAmount("");
      showToast(response.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour du solde impossible.");
    } finally {
      setBalanceLoading(false);
    }
  }

  function toggleBadge(badgeId: string): void {
    setSelectedBadges((current) =>
      current.includes(badgeId) ? current.filter((id) => id !== badgeId) : [...current, badgeId]
    );
  }

  if (loading) return <p>Chargement de la fiche utilisateur...</p>;
  if (!details) return <p className="error-text">{error ?? "Utilisateur introuvable."}</p>;

  const target = details.user;
  const createdAt = target.created_at ? new Date(target.created_at).toLocaleString("fr-FR") : "N/A";
  const availableBadges = details.availableBadges ?? [];
  const balanceCents = target.balance_cents ?? 0;
  const lastBalanceUpdate = target.last_balance_update ? new Date(target.last_balance_update).toLocaleString("fr-FR") : "N/A";

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Fiche utilisateur</h2>
        <p>
          {target.pseudo}
          {target.customer_reference ? ` · ${target.customer_reference}` : ""}
        </p>
        <p>Vue par sections : compte, serveurs, tickets, abonnements.</p>
      </div>

      <article className="card">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className={`btn ${activeTab === "compte" ? "" : "btn-ghost"}`} type="button" onClick={() => setActiveTab("compte")}>
            Le compte
          </button>
          <button className={`btn ${activeTab === "serveurs" ? "" : "btn-ghost"}`} type="button" onClick={() => setActiveTab("serveurs")}>
            Les serveurs
          </button>
          <button className={`btn ${activeTab === "tickets" ? "" : "btn-ghost"}`} type="button" onClick={() => setActiveTab("tickets")}>
            Les tickets
          </button>
          <button className={`btn ${activeTab === "abonnements" ? "" : "btn-ghost"}`} type="button" onClick={() => setActiveTab("abonnements")}>
            Les abonnements
          </button>
        </div>
      </article>

      {activeTab === "compte" && (
        <>
          <article className="card admin-user-card">
            <div className="admin-user-header">
              <div>
                <h3>{target.pseudo}</h3>
                <p>{target.email}</p>
              </div>
              <div className="admin-user-meta">
                <span className="tag">Créé le : {createdAt}</span>
                <span className="tag">Rôle : {target.role}</span>
                <span className="tag">Langue : {(target.language ?? "fr").toUpperCase()}</span>
                {target.customer_reference && <span className="tag">Réf client : {target.customer_reference}</span>}
                {isFakeAccount && <span className="status-pill status-failed">FAKE ACCOUNT</span>}
              </div>
            </div>

            <div className="admin-user-split">
              <div className="admin-user-section">
                <h4>Statut du compte</h4>
                <div className="admin-user-meta">
                  <span className={`status-pill ${target.email_verified ? "status-paid" : "status-failed"}`}>
                    {target.email_verified ? "Email vérifié" : "Email non vérifié"}
                  </span>
                  <span className={`status-pill ${target.two_factor_enabled ? "status-paid" : "status-pending"}`}>
                    {target.two_factor_enabled ? "2FA activée" : "2FA désactivée"}
                  </span>
                  {target.discord_linked && <span className="status-pill status-paid">Compte créé et connecté via Discord</span>}
                </div>
              </div>
              <div className="admin-user-section">
                <h4>Badges</h4>
                {!target.badges || target.badges.length === 0 ? (
                  <p className="dashboard-muted">Aucun badge attribué.</p>
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
            </div>

            <div className="admin-user-split">
              <div className="admin-user-section">
                <h4>Bio</h4>
                {target.bio ? <p>{target.bio}</p> : <p className="dashboard-muted">Aucune bio renseignée.</p>}
              </div>
              <div className="admin-user-section">
                <h4>Note interne</h4>
                {target.internal_note ? <p>{target.internal_note}</p> : <p className="dashboard-muted">Aucune note interne.</p>}
              </div>
            </div>

            <div className="admin-user-section">
              <h4>Solde</h4>
              <div className="admin-user-balance">
                <div className="admin-user-balance-main">
                  <strong>{(balanceCents / 100).toFixed(2)} EUR</strong>
                  <span className="dashboard-muted">Dernière mise à jour : {lastBalanceUpdate}</span>
                </div>
                <div className="admin-user-balance-actions">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Montant en euros"
                    value={balanceAmount}
                    onChange={(event) => setBalanceAmount(event.target.value)}
                  />
                  <button className="btn" type="button" disabled={balanceLoading} onClick={() => void updateBalance("credit")}>
                    {balanceLoading ? "Mise à jour..." : "Créditer"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={balanceLoading}
                    onClick={() => void updateBalance("debit")}
                  >
                    {balanceLoading ? "Mise à jour..." : "Débiter"}
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-user-section">
              <h4>Actions</h4>
              <div className="admin-user-actions">
                {!target.email_verified && (
                  <button className="btn" type="button" disabled={sendingCode} onClick={() => void resendCode("verification")}>
                    {sendingCode ? "Envoi..." : "Renvoyer le code email"}
                  </button>
                )}
                <button className="btn btn-ghost" type="button" disabled={sendingCode} onClick={() => void resendCode("2fa")}>
                  {sendingCode ? "Envoi..." : "Envoyer un code 2FA"}
                </button>
                {target.two_factor_enabled && (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={async () => {
                      if (!token) return;
                      const confirmed = window.confirm("Confirmer la désactivation de la double authentification (2FA) pour cet utilisateur ?");
                      if (!confirmed) return;
                      try {
                        await apiRequest(`/admin/users/${target.id}/disable-2fa`, { method: "POST", token });
                        showToast("2FA désactivée pour cet utilisateur.");
                        await loadDetails();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Désactivation 2FA impossible.");
                      }
                    }}
                  >
                    Désactiver la 2FA
                  </button>
                )}
                {target.id !== authUser?.id && (
                  <button className="btn btn-danger" type="button" disabled={deleting} onClick={() => void deleteUser()}>
                    {deleting ? "Suppression..." : "Supprimer l'utilisateur"}
                  </button>
                )}
              </div>
            </div>
          </article>

          <article className="card">
            <h3>Éditer l’utilisateur</h3>
            <form className="form" onSubmit={updateUser}>
              {error && <p className="error-text">{error}</p>}
              <label>
                Pseudo
                <input
                  value={formState.pseudo}
                  onChange={(event) => setFormState((prev) => ({ ...prev, pseudo: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Rôle
                <select value={formState.role} onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value as "user" | "admin" }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Bio
                <textarea
                  rows={4}
                  value={formState.bio}
                  onChange={(event) => setFormState((prev) => ({ ...prev, bio: event.target.value }))}
                />
              </label>
              <label>
                Note interne
                <textarea
                  rows={4}
                  value={formState.internalNote}
                  onChange={(event) => setFormState((prev) => ({ ...prev, internalNote: event.target.value }))}
                />
              </label>
              <div>
                <p className="admin-field-title">Badges</p>
                {availableBadges.length === 0 ? (
                  <p>Aucun badge disponible.</p>
                ) : (
                  <div className="admin-badge-grid">
                    {availableBadges.map((badge) => (
                      <label key={badge.id} className="admin-badge-option">
                        <input
                          type="checkbox"
                          checked={selectedBadges.includes(badge.id)}
                          onChange={() => toggleBadge(badge.id)}
                        />
                        <img src={badge.image_url} alt={badge.label} loading="lazy" />
                        <span>{badge.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Mise à jour..." : "Enregistrer les changements"}
              </button>
            </form>
          </article>

          <article className="card">
            <h3>Envoyer un email</h3>
            <form className="form" onSubmit={sendAdminMail}>
              {error && <p className="error-text">{error}</p>}
              <label>
                Sujet
                <input
                  value={mailForm.subject}
                  onChange={(event) => setMailForm((prev) => ({ ...prev, subject: event.target.value }))}
                  required
                />
              </label>
              <label>
                Contenu
                <textarea
                  rows={6}
                  value={mailForm.content}
                  onChange={(event) => setMailForm((prev) => ({ ...prev, content: event.target.value }))}
                  required
                />
              </label>
              <button className="btn" type="submit" disabled={sendingMail}>
                {sendingMail ? "Envoi..." : "Envoyer l'email"}
              </button>
            </form>
          </article>

          <article className="card">
            <h3>Emails envoyés par nos services</h3>
            {details.emailEvents.length === 0 ? (
              <p>Aucun email enregistré.</p>
            ) : (
              <div className="admin-list-grid">
                {details.emailEvents.map((event, index) => (
                  <div key={`${event.type}-${event.created_at}-${index}`} className="admin-list-item static">
                    <div>
                      <h3>{event.type === "verification" ? "Vérification email" : "Code 2FA"}</h3>
                      <p>Envoyé le {new Date(event.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="admin-list-item-meta">
                      <span className={`status-pill ${event.used ? "status-paid" : "status-pending"}`}>
                        {event.used ? "Utilisé" : "En attente"}
                      </span>
                      <span className="tag">Expire le {new Date(event.expires_at).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="card">
            <h3>Historique des IP</h3>
            {details.ipEvents.length === 0 ? (
              <p>Aucune IP enregistrée.</p>
            ) : (
              <div className="admin-list-grid">
                {details.ipEvents.map((event) => {
                  const locationParts = [event.city, event.region, event.country].filter(Boolean);
                  const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : "Localisation inconnue";
                  const providerLabel = event.provider ?? "Fournisseur inconnu";
                  const eventLabel =
                    event.event_type === "register"
                      ? "Inscription"
                      : event.event_type === "login"
                        ? "Connexion"
                        : "Message tchat";
                  return (
                    <div key={event.id} className="admin-list-item static">
                      <div>
                        <h3>{eventLabel}</h3>
                        <p>IP : {event.ip}</p>
                        <p>{locationLabel}</p>
                      </div>
                      <div className="admin-list-item-meta">
                        <span className="tag">{providerLabel}</span>
                        <span className="tag">{new Date(event.created_at).toLocaleString("fr-FR")}</span>
                        {event.chat_message_id && <span className="tag">Message : {event.chat_message_id}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </>
      )}

      {activeTab === "serveurs" && (
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
                    {server.is_fake && <span className="status-pill status-failed">FAKE SERVER</span>}
                    <Link className="btn btn-ghost" to={`/servers/${server.id}`}>
                      Ouvrir la fiche serveur
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {activeTab === "abonnements" && (
        <article className="card">
          <h3>Abonnements actifs et historiques</h3>
          {details.subscriptions.length === 0 ? (
            <p>Aucun abonnement associé.</p>
          ) : (
            <div className="admin-list-grid">
              {details.subscriptions.map((subscription) => (
                <div key={subscription.id} className="admin-list-item static">
                  <div>
                    <h3>{subscription.server_name}</h3>
                    <p>Type : {subscription.type}</p>
                  </div>
                  <div className="admin-list-item-meta">
                    <span className="tag">Début : {new Date(subscription.start_date).toLocaleDateString("fr-FR")}</span>
                    <span className="tag">Fin : {new Date(subscription.end_date).toLocaleDateString("fr-FR")}</span>
                    {subscription.premium_slot && <span className="tag">Slot #{subscription.premium_slot}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {activeTab === "tickets" && (
        <article className="card">
          <h3>Tickets de cet utilisateur</h3>
          {ticketsLoading ? (
            <p>Chargement des tickets...</p>
          ) : ticketsError ? (
            <p className="error-text">{ticketsError}</p>
          ) : tickets.length === 0 ? (
            <p>Aucun ticket trouvé.</p>
          ) : (
            <div className="admin-list-grid">
              {tickets.map((t) => (
                <div key={t.id} className="admin-list-item">
                  <div>
                    <h3>{t.reference}</h3>
                    <p>{t.category}{t.subcategory ? ` · ${t.subcategory}` : ""}</p>
                  </div>
                  <div className="admin-list-item-meta">
                    <span className="tag">{t.status}</span>
                    <span className="tag">Priorité {t.priority}</span>
                    <Link className="btn btn-ghost" to={`/admin/tickets?ticketId=${t.id}`}>
                      Ouvrir le ticket
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
