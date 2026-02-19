import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Badge, Category, Server, User } from "../types";

type UsersResponse = { users: User[]; availableBadges: Badge[] };
type ServersResponse = { servers: Server[] };
type CategoriesResponse = { categories: Category[] };
type SubscriptionsResponse = {
  subscriptions: Array<{
    id: string;
    server_id: string;
    server_name: string;
    owner_pseudo: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot: number | null;
  }>;
};

export function AdminPage(): JSX.Element {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionsResponse["subscriptions"]>([]);
  const [promoServerId, setPromoServerId] = useState("");
  const [promoType, setPromoType] = useState<"quokka_plus" | "essentiel">("quokka_plus");
  const [promoDurationDays, setPromoDurationDays] = useState(30);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedServerId, setSelectedServerId] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("Le site est en maintenance.");
  const [userForm, setUserForm] = useState({
    pseudo: "",
    email: "",
    bio: "",
    internalNote: "",
    role: "user" as "user" | "admin",
    badgeIds: [] as string[]
  });
  const [serverForm, setServerForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    website: "",
    countryCode: "FR",
    ip: "",
    port: "",
    inviteLink: "",
    bannerUrl: "",
    isPublic: true,
    isHidden: false,
    isVisible: true,
    verified: false
  });
  const [error, setError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  async function loadData(): Promise<void> {
    if (!token) return;
    try {
      const [usersData, serversData, categoriesData, subscriptionsData, maintenanceData] = await Promise.all([
        apiRequest<UsersResponse>("/admin/users", { token }),
        apiRequest<ServersResponse>("/admin/servers", { token }),
        apiRequest<CategoriesResponse>("/servers/categories"),
        apiRequest<SubscriptionsResponse>("/admin/subscriptions", { token }),
        apiRequest<{ maintenance: { is_enabled: boolean; message: string } }>("/maintenance")
      ]);
      setUsers(usersData.users);
      setAvailableBadges(usersData.availableBadges ?? []);
      setServers(serversData.servers);
      setCategories(categoriesData.categories);
      setSubscriptions(subscriptionsData.subscriptions);
      setMaintenance(maintenanceData.maintenance?.is_enabled ?? false);
      setMaintenanceMessage(maintenanceData.maintenance?.message ?? "Le site est en maintenance.");
      if (serversData.servers.length) {
        setPromoServerId((current) => current || serversData.servers[0].id);
        setSelectedServerId((current) => current || serversData.servers[0].id);
      }
      if (usersData.users.length) {
        setSelectedUserId((current) => current || usersData.users[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement admin impossible.");
    }
  }

  useEffect(() => {
    void loadData();
  }, [token]);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [selectedUserId, users]);
  const selectedServer = useMemo(() => servers.find((s) => s.id === selectedServerId) ?? null, [selectedServerId, servers]);

  useEffect(() => {
    if (!selectedUser) return;
    setUserForm({
      pseudo: selectedUser.pseudo,
      email: selectedUser.email,
      bio: selectedUser.bio ?? "",
      internalNote: selectedUser.internal_note ?? "",
      role: selectedUser.role,
      badgeIds: selectedUser.badges?.map((badge) => badge.id) ?? []
    });
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedServer) return;
    setServerForm({
      categoryId: selectedServer.category_id,
      name: selectedServer.name,
      description: selectedServer.description,
      website: selectedServer.website ?? "",
      countryCode: selectedServer.country_code,
      ip: selectedServer.ip ?? "",
      port: selectedServer.port ? String(selectedServer.port) : "",
      inviteLink: selectedServer.invite_link ?? "",
      bannerUrl: selectedServer.banner_url ?? "",
      isPublic: selectedServer.is_public,
      isHidden: selectedServer.is_hidden,
      isVisible: selectedServer.is_visible,
      verified: selectedServer.verified
    });
  }, [selectedServer]);

  async function onPromote(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/servers/promote", {
        method: "POST",
        token,
        body: { serverId: promoServerId, type: promoType, durationDays: promoDurationDays }
      });
      showToast("Mise en avant appliquée.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise en avant impossible.");
    }
  }

  async function onUpdateUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !selectedUserId) return;
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/users", {
        method: "PATCH",
        token,
        body: {
          userId: selectedUserId,
          pseudo: userForm.pseudo,
          email: userForm.email,
          bio: userForm.bio,
          internalNote: userForm.internalNote,
          role: userForm.role,
          badgeIds: userForm.badgeIds
        }
      });
      showToast("Utilisateur mis à jour.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification utilisateur impossible.");
    }
  }

  async function onUpdateServer(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !selectedServerId) return;
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/servers", {
        method: "PATCH",
        token,
        body: {
          serverId: selectedServerId,
          categoryId: serverForm.categoryId,
          name: serverForm.name,
          description: serverForm.description,
          website: serverForm.website.trim() ? serverForm.website.trim() : null,
          countryCode: serverForm.countryCode.toUpperCase(),
          ip: serverForm.ip.trim() ? serverForm.ip.trim() : null,
          port: serverForm.port.trim() ? Number(serverForm.port) : null,
          inviteLink: serverForm.inviteLink.trim() ? serverForm.inviteLink.trim() : null,
          bannerUrl: serverForm.bannerUrl.trim() ? serverForm.bannerUrl.trim() : null,
          isPublic: serverForm.isPublic,
          isHidden: serverForm.isHidden,
          isVisible: serverForm.isVisible,
          verified: serverForm.verified
        }
      });
      showToast("Serveur mis à jour.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification serveur impossible.");
    }
  }

  async function onDeleteSubscription(subscriptionId: string): Promise<void> {
    if (!token) return;
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/subscriptions", {
        method: "DELETE",
        token,
        body: { subscriptionId }
      });
      showToast("Abonnement supprimé.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression abonnement impossible.");
    }
  }

  async function onMaintenance(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiRequest<{ message: string }>("/maintenance", {
        method: "PATCH",
        token,
        body: { isEnabled: maintenance, message: maintenanceMessage }
      });
      showToast("Mode maintenance mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Maintenance impossible.");
    }
  }

  async function onResendCode(type: "verification" | "2fa"): Promise<void> {
    if (!token || !selectedUserId) return;
    setSendingCode(true);
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/users/resend-code", {
        method: "POST",
        token,
        body: { userId: selectedUserId, type }
      });
      showToast(type === "verification" ? "Code de vérification envoyé." : "Code 2FA envoyé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer le code.");
    } finally {
      setSendingCode(false);
    }
  }

  async function onDeleteUser(): Promise<void> {
    if (!token || !selectedUserId || !selectedUser) return;
    
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser.pseudo}" ?\n\nCette action est irréversible et supprimera :\n- Le compte utilisateur\n- Tous ses serveurs\n- Toutes ses données\n\nTapez "${selectedUser.pseudo}" pour confirmer.`;
    
    const userInput = window.prompt(confirmMessage);
    
    if (userInput !== selectedUser.pseudo) {
      if (userInput !== null) {
        showToast("Suppression annulée : confirmation incorrecte.");
      }
      return;
    }

    setDeletingUser(true);
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/users", {
        method: "DELETE",
        token,
        body: { userId: selectedUserId }
      });
      showToast("Utilisateur supprimé avec succès.");
      await loadData();
      // Réinitialiser la sélection
      setSelectedUserId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de supprimer l'utilisateur.");
    } finally {
      setDeletingUser(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <section className="page">
        <h1>Admin panel</h1>
        <p>Accès réservé aux administrateurs.</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>Admin panel</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="admin-kpis">
        <article className="card admin-kpi">
          <span>Utilisateurs</span>
          <strong>{users.length}</strong>
        </article>
        <article className="card admin-kpi">
          <span>Serveurs</span>
          <strong>{servers.length}</strong>
        </article>
        <article className="card admin-kpi">
          <span>Abonnements</span>
          <strong>{subscriptions.length}</strong>
        </article>
      </div>

      <div className="grid two-cols">
        <article className="card">
          <h2>Promotion serveur</h2>
          <form className="form" onSubmit={onPromote}>
            <label>
              Serveur
              <select value={promoServerId} onChange={(event) => setPromoServerId(event.target.value)}>
                {servers.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type premium
              <select
                value={promoType}
                onChange={(event) => setPromoType(event.target.value as "quokka_plus" | "essentiel")}
              >
                <option value="quokka_plus">Quokka+</option>
                <option value="essentiel">Quokka Essentiel</option>
              </select>
            </label>
            <label>
              Durée (jours)
              <input
                type="number"
                min={1}
                max={365}
                value={promoDurationDays}
                onChange={(event) => setPromoDurationDays(Number(event.target.value))}
              />
            </label>
            <button className="btn" type="submit">
              Appliquer
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Maintenance</h2>
          <form className="form" onSubmit={onMaintenance}>
            <label className="inline-control">
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(event) => setMaintenance(event.target.checked)}
              />
              Activer maintenance
            </label>
            <label>
              Message
              <textarea
                value={maintenanceMessage}
                rows={4}
                onChange={(event) => setMaintenanceMessage(event.target.value)}
              />
            </label>
            <button className="btn" type="submit">
              Mettre à jour
            </button>
          </form>
        </article>
      </div>

      <div className="grid two-cols">
        <article className="card">
          <h2>Utilisateurs</h2>
          <div className="admin-toolbar">
            <label>
              Sélection
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.pseudo} ({u.role})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <form className="form" onSubmit={onUpdateUser}>
            <label>
              Pseudo
              <input
                value={userForm.pseudo}
                onChange={(event) => setUserForm((current) => ({ ...current, pseudo: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            {selectedUser && selectedUser.language && (
              <div style={{
                padding: "0.75rem",
                backgroundColor: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: "8px",
                marginBottom: "1rem"
              }}>
                <p style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "#1e40af",
                  fontWeight: "500"
                }}>
                  🌐 Langue détectée : {selectedUser.language.toUpperCase()}
                  {selectedUser.language === "fr" && " - Français"}
                  {selectedUser.language === "en" && " - English"}
                  {selectedUser.language === "es" && " - Español"}
                  {selectedUser.language === "de" && " - Deutsch"}
                  {selectedUser.language === "it" && " - Italiano"}
                  {selectedUser.language === "pt" && " - Português"}
                  {selectedUser.language === "zh" && " - 中文"}
                  {selectedUser.language === "ja" && " - 日本語"}
                  {selectedUser.language === "hi" && " - हिन्दी"}
                  {selectedUser.language === "ru" && " - Русский"}
                  {selectedUser.language === "uk" && " - Українська"}
                </p>
              </div>
            )}
            {selectedUser && (
              <div style={{
                padding: "0.75rem",
                backgroundColor: selectedUser.email_verified ? "#f0fdf4" : "#fef3c7",
                border: `1px solid ${selectedUser.email_verified ? "#86efac" : "#fcd34d"}`,
                borderRadius: "8px",
                marginBottom: "1rem"
              }}>
                <p style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: selectedUser.email_verified ? "#166534" : "#92400e",
                  fontWeight: "500"
                }}>
                  {selectedUser.email_verified ? "✓ Email vérifié" : "⚠ Email non vérifié"}
                </p>
                {!selectedUser.email_verified && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void onResendCode("verification")}
                    disabled={sendingCode}
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem"
                    }}
                  >
                    {sendingCode ? "Envoi..." : "Renvoyer code de vérification"}
                  </button>
                )}
              </div>
            )}
            <label>
              Rôle
              <select
                value={userForm.role}
                onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as "user" | "admin" }))}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            {selectedUser && (
              <div style={{
                padding: "0.75rem",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                marginBottom: "1rem"
              }}>
                <p style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.875rem",
                  color: "#374151",
                  fontWeight: "500"
                }}>
                  Double authentification : {selectedUser.two_factor_enabled ? "Activée" : "Désactivée"}
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void onResendCode("2fa")}
                  disabled={sendingCode}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem"
                  }}
                >
                  {sendingCode ? "Envoi..." : "Envoyer code 2FA"}
                </button>
              </div>
            )}
            <label>
              Bio
              <textarea
                rows={4}
                value={userForm.bio}
                onChange={(event) => setUserForm((current) => ({ ...current, bio: event.target.value }))}
              />
            </label>
            <label>
              Notes internes (admin)
              <textarea
                rows={6}
                value={userForm.internalNote}
                onChange={(event) => setUserForm((current) => ({ ...current, internalNote: event.target.value }))}
                placeholder="Notes privées visibles uniquement dans l'admin."
              />
            </label>
            <div>
              <p className="admin-field-title">Badges du profil</p>
              {availableBadges.length === 0 ? (
                <p>Aucun badge disponible.</p>
              ) : (
                <div className="admin-badge-grid">
                  {availableBadges.map((badge) => {
                    const isChecked = userForm.badgeIds.includes(badge.id);
                    return (
                      <label key={badge.id} className="admin-badge-option">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setUserForm((current) => ({
                              ...current,
                              badgeIds: checked
                                ? [...current.badgeIds, badge.id]
                                : current.badgeIds.filter((value) => value !== badge.id)
                            }));
                          }}
                        />
                        <img src={badge.image_url} alt={`Badge ${badge.label}`} loading="lazy" />
                        <span>{badge.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="btn" type="submit">
              Enregistrer l’utilisateur
            </button>            {selectedUser && selectedUser.id !== user?.id && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void onDeleteUser()}
                disabled={deletingUser}
                style={{
                  marginTop: "1rem",
                  backgroundColor: "#ef4444",
                  borderColor: "#dc2626"
                }}
              >
                {deletingUser ? "Suppression..." : "Supprimer l'utilisateur"}
              </button>
            )}
          </form>
        </article>

        <article className="card">
          <h2>Serveurs</h2>
          <div className="admin-toolbar">
            <label>
              Sélection
              <select value={selectedServerId} onChange={(event) => setSelectedServerId(event.target.value)}>
                {servers.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <form className="form" onSubmit={onUpdateServer}>
            <label>
              Catégorie
              <select
                value={serverForm.categoryId}
                onChange={(event) => setServerForm((current) => ({ ...current, categoryId: event.target.value }))}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nom
              <input value={serverForm.name} onChange={(event) => setServerForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={serverForm.description}
                onChange={(event) => setServerForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label>
              Site web
              <input
                value={serverForm.website}
                onChange={(event) => setServerForm((current) => ({ ...current, website: event.target.value }))}
              />
            </label>
            <div className="admin-inline-grid">
              <label>
                Pays
                <input
                  value={serverForm.countryCode}
                  maxLength={2}
                  onChange={(event) => setServerForm((current) => ({ ...current, countryCode: event.target.value.toUpperCase() }))}
                />
              </label>
              <label>
                IP
                <input value={serverForm.ip} onChange={(event) => setServerForm((current) => ({ ...current, ip: event.target.value }))} />
              </label>
              <label>
                Port
                <input
                  type="number"
                  value={serverForm.port}
                  onChange={(event) => setServerForm((current) => ({ ...current, port: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Lien invitation
              <input
                value={serverForm.inviteLink}
                onChange={(event) => setServerForm((current) => ({ ...current, inviteLink: event.target.value }))}
              />
            </label>
            <label>
              Bannière
              <input
                value={serverForm.bannerUrl}
                onChange={(event) => setServerForm((current) => ({ ...current, bannerUrl: event.target.value }))}
              />
            </label>
            <div className="admin-toggles">
              <label className="inline-control">
                <input
                  type="checkbox"
                  checked={serverForm.isPublic}
                  onChange={(event) => setServerForm((current) => ({ ...current, isPublic: event.target.checked }))}
                />
                Public
              </label>
              <label className="inline-control">
                <input
                  type="checkbox"
                  checked={serverForm.isHidden}
                  onChange={(event) => setServerForm((current) => ({ ...current, isHidden: event.target.checked }))}
                />
                Caché
              </label>
              <label className="inline-control">
                <input
                  type="checkbox"
                  checked={serverForm.isVisible}
                  onChange={(event) => setServerForm((current) => ({ ...current, isVisible: event.target.checked }))}
                />
                Visible
              </label>
              <label className="inline-control">
                <input
                  type="checkbox"
                  checked={serverForm.verified}
                  onChange={(event) => setServerForm((current) => ({ ...current, verified: event.target.checked }))}
                />
                Vérifié
              </label>
            </div>
            <button className="btn" type="submit">
              Enregistrer le serveur
            </button>
          </form>
        </article>
      </div>

      <article className="card">
        <h2>Abonnements</h2>
        <div className="admin-subscription-list">
          {subscriptions.length === 0 ? (
            <p>Aucun abonnement trouvé.</p>
          ) : (
            subscriptions.map((sub) => (
              <article key={sub.id} className="admin-subscription-item">
                <div>
                  <h3>{sub.server_name}</h3>
                  <p>
                    {sub.type} • {sub.owner_pseudo}
                  </p>
                  <p>
                    Du {new Date(sub.start_date).toLocaleString("fr-FR")} au{" "}
                    {new Date(sub.end_date).toLocaleString("fr-FR")}
                  </p>
                </div>
                <button className="btn btn-danger" type="button" onClick={() => void onDeleteSubscription(sub.id)}>
                  Supprimer
                </button>
              </article>
            ))
          )}
        </div>
      </article>
    </section>
  );
}

