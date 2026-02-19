import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Category, Server, User } from "../types";

type Subscription = {
  id: string;
  server_id: string;
  server_name: string;
  type: "quokka_plus" | "essentiel";
  start_date: string;
  end_date: string;
  premium_slot: number | null;
};

type DashboardResponse = {
  user: User;
  servers: Server[];
  subscriptions: Subscription[];
};

type CategoriesResponse = {
  categories: Category[];
};

type PromoteType = "quokka_plus" | "essentiel";
type DashboardSection = "profile" | "servers" | "subscriptions" | "settings";

const COMMUNITY_SLUGS = new Set(["discord", "stoat"]);
const COUNTRIES = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "CA", label: "Canada" },
  { code: "US", label: "États-Unis" },
  { code: "DE", label: "Allemagne" }
];

function getSubscriptionDisplayLabel(type: "quokka_plus" | "essentiel"): string {
  return type === "essentiel" ? "Quokka Essentiel (par jour)" : "Quokka+ (par heure)";
}

function formatAmountEur(amount: number): string {
  return `${amount.toFixed(2)} EUR`;
}

export function DashboardPage(): JSX.Element {
  const { token, isAuthenticated, updateUser } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [blueskyUrl, setBlueskyUrl] = useState("");
  const [stoatUrl, setStoatUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [kickUrl, setKickUrl] = useState("");
  const [snapchatUrl, setSnapchatUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editCountryCode, setEditCountryCode] = useState("FR");
  const [editIp, setEditIp] = useState("");
  const [editPort, setEditPort] = useState(25565);
  const [editInviteLink, setEditInviteLink] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [promoteTypeByServer, setPromoteTypeByServer] = useState<Record<string, PromoteType>>({});
  const [promoteDaysByServer, setPromoteDaysByServer] = useState<Record<string, number>>({});
  const [promoteHoursByServer, setPromoteHoursByServer] = useState<Record<string, number>>({});
  const [promoteStartDateByServer, setPromoteStartDateByServer] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<DashboardSection>("profile");
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard(): Promise<void> {
    if (!token) return;
    try {
      const [result, categoriesResult] = await Promise.all([
        apiRequest<DashboardResponse>("/dashboard", { token }),
        apiRequest<CategoriesResponse>("/servers/categories")
      ]);
      setData(result);
      setCategories(categoriesResult.categories);
      setPseudo(result.user.pseudo);
      setBio(result.user.bio ?? "");
      setTwoFactorEnabled(result.user.two_factor_enabled ?? true);
      setAvatarUrl(result.user.avatar_url ?? "");
      setDiscordUrl(result.user.discord_url ?? "");
      setXUrl(result.user.x_url ?? "");
      setBlueskyUrl(result.user.bluesky_url ?? "");
      setStoatUrl(result.user.stoat_url ?? "");
      setYoutubeUrl(result.user.youtube_url ?? "");
      setTwitchUrl(result.user.twitch_url ?? "");
      setKickUrl(result.user.kick_url ?? "");
      setSnapchatUrl(result.user.snapchat_url ?? "");
      setTiktokUrl(result.user.tiktok_url ?? "");
      updateUser(result.user);
      setPromoteTypeByServer((current) => {
        const next = { ...current };
        for (const server of result.servers) {
          if (!next[server.id]) next[server.id] = "essentiel";
        }
        return next;
      });
      setPromoteDaysByServer((current) => {
        const next = { ...current };
        for (const server of result.servers) {
          if (!next[server.id]) next[server.id] = 30;
        }
        return next;
      });
      setPromoteHoursByServer((current) => {
        const next = { ...current };
        for (const server of result.servers) {
          if (!next[server.id]) next[server.id] = 6;
        }
        return next;
      });
      setPromoteStartDateByServer((current) => {
        const next = { ...current };
        const today = new Date().toISOString().slice(0, 10);
        for (const server of result.servers) {
          if (!next[server.id]) next[server.id] = today;
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger le dashboard.");
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      showToast("Paiement validé, la promotion sera activée automatiquement.");
      setActiveSection("subscriptions");
      void loadDashboard();
    }
    if (payment === "cancel") {
      setError("Paiement annulé.");
    }
  }, []);

  async function onUpdateProfile(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiRequest<{ message: string }>("/dashboard/profile", {
        method: "PATCH",
        token,
        body: {
          pseudo,
          bio,
          avatarUrl,
          discordUrl,
          xUrl,
          blueskyUrl,
          stoatUrl,
          youtubeUrl,
          twitchUrl,
          kickUrl,
          snapchatUrl,
          tiktokUrl
        }
      });
      showToast("Profil mis à jour.");
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
  }

  async function onToggle2FA(enabled: boolean): Promise<void> {
    if (!token) return;
    setToggling2FA(true);
    setError(null);
    try {
      const response = await apiRequest<{ message: string; two_factor_enabled: boolean }>("/dashboard/toggle-2fa", {
        method: "POST",
        token,
        body: { enabled }
      });
      setTwoFactorEnabled(response.two_factor_enabled);
      showToast(response.message);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de modifier la 2FA.");
    } finally {
      setToggling2FA(false);
    }
  }

  function startEdit(server: Server): void {
    setExpandedServerId(server.id);
    setEditServerId(server.id);
    setEditCategoryId(server.category_id);
    setEditName(server.name);
    setEditDescription(server.description);
    setEditWebsite(server.website ?? "");
    setEditCountryCode(server.country_code);
    setEditIp(server.ip ?? "");
    setEditPort(server.port ?? 25565);
    setEditInviteLink(server.invite_link ?? "");
    setEditBannerUrl(server.banner_url ?? "");
    setEditIsPublic(server.is_public);
  }

  function stopEdit(): void {
    setEditServerId(null);
  }

  function toggleServerDetails(serverId: string): void {
    setExpandedServerId((current) => {
      const next = current === serverId ? null : serverId;
      if (current === serverId && editServerId === serverId) {
        stopEdit();
      }
      return next;
    });
  }

  async function onSaveServer(serverId: string): Promise<void> {
    if (!token) return;
    const selectedCategory = categories.find((item) => item.id === editCategoryId);
    const isCommunity = selectedCategory ? COMMUNITY_SLUGS.has(selectedCategory.slug) : false;

    try {
      await apiRequest<{ message: string }>(`/servers/${serverId}`, {
        method: "PATCH",
        token,
        body: {
          categoryId: editCategoryId,
          name: editName,
          description: editDescription,
          website: editWebsite,
          countryCode: editCountryCode,
          ip: isCommunity ? undefined : editIp,
          port: isCommunity ? undefined : Number(editPort),
          inviteLink: isCommunity ? editInviteLink : undefined,
          bannerUrl: editBannerUrl,
          isPublic: editIsPublic
        }
      });
      showToast("Serveur mis à jour.");
      setError(null);
      stopEdit();
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification serveur impossible.");
    }
  }

  async function onDeleteServer(serverId: string): Promise<void> {
    if (!token) return;
    const confirmed = window.confirm("Confirmer la suppression de ce serveur ?");
    if (!confirmed) return;

    try {
      await apiRequest<void>(`/servers/${serverId}`, {
        method: "DELETE",
        token
      });
      showToast("Serveur supprimé.");
      setError(null);
      if (editServerId === serverId) stopEdit();
      if (expandedServerId === serverId) setExpandedServerId(null);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression serveur impossible.");
    }
  }

  async function onPromoteServer(serverId: string): Promise<void> {
    if (!token) return;
    try {
      const type = promoteTypeByServer[serverId] ?? "essentiel";
      const payload =
        type === "essentiel"
          ? {
              serverId,
              type,
              days: Math.min(30, Math.max(1, promoteDaysByServer[serverId] ?? 1)),
              startDate: new Date(`${promoteStartDateByServer[serverId]}T00:00:00`).toISOString()
            }
          : {
              serverId,
              type,
              hours: Math.min(24, Math.max(1, promoteHoursByServer[serverId] ?? 1))
            };

      const response = await apiRequest<{ checkoutUrl: string }>("/payments/checkout-session", {
        method: "POST",
        token,
        body: payload
      });
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création du paiement impossible.");
    }
  }

  const totalServers = data?.servers.length ?? 0;

  if (!isAuthenticated) {
    return (
      <section className="page">
        <h1>Dashboard</h1>
        <p>Connectez-vous pour accéder à votre espace.</p>
      </section>
    );
  }

  return (
    <section className="page dashboard-page">
      <article className="card dashboard-header">
        <div>
          <h1>Dashboard utilisateur</h1>
          <p className="dashboard-subtitle">
            Espace centralise avec sections separees : profil, serveurs, abonnements et parametres.
          </p>
        </div>
      </article>

      <article className="card dashboard-section-tabs">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeSection === "profile" ? "active" : ""}`}
          onClick={() => setActiveSection("profile")}
        >
          Profil
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeSection === "servers" ? "active" : ""}`}
          onClick={() => setActiveSection("servers")}
        >
          Serveurs ({totalServers})
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeSection === "subscriptions" ? "active" : ""}`}
          onClick={() => setActiveSection("subscriptions")}
        >
          Abonnements
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeSection === "settings" ? "active" : ""}`}
          onClick={() => setActiveSection("settings")}
        >
          Parametres
        </button>
      </article>

      {error && (
        <div className="dashboard-feedback">
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {activeSection === "profile" && (
        <div className="dashboard-layout">
          <article className="card dashboard-section">
            <div className="dashboard-section-head">
              <h2>Profil</h2>
              <p>Identite, avatar et presentation de votre compte.</p>
            </div>
            <form className="form" onSubmit={onUpdateProfile}>
              <div className="avatar-block">
                {avatarUrl ? (
                  <img className="avatar-128" src={avatarUrl} alt="Avatar utilisateur" />
                ) : (
                  <div className="avatar-128 avatar-fallback">128x128</div>
                )}
              </div>
              <label>
                Pseudo
                <input value={pseudo} onChange={(event) => setPseudo(event.target.value)} required />
              </label>
              <label>
                Bio
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={5} />
              </label>
              <label>
                Avatar (Imgur - JPG, JPEG, PNG, GIF)
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://i.imgur.com/mon-avatar.png"
                />
              </label>
              <button className="btn" type="submit">
                Sauvegarder mon profil
              </button>
            </form>
          </article>

          <article className="card dashboard-section">
            <div className="dashboard-section-head">
              <h2>Badges</h2>
              <p>Badges attribues a votre profil.</p>
            </div>
            {data?.user.badges?.length ? (
              <div className="dashboard-badge-list">
                {data.user.badges.map((badge) => (
                  <div key={badge.id} className="dashboard-badge-item">
                    <img className="dashboard-badge-icon" src={badge.image_url} alt={`Badge ${badge.label}`} loading="lazy" />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucun badge attribue pour le moment.</p>
            )}
          </article>
        </div>
      )}

      {activeSection === "subscriptions" && (
        <div className="dashboard-layout">
          <article className="card dashboard-section">
            <div className="dashboard-section-head">
              <h2>Mes abonnements</h2>
              <p>Resume des promotions actuellement actives.</p>
            </div>
            <ul className="list dashboard-subscriptions-list">
              {data?.subscriptions.length ? (
                data.subscriptions.map((sub) => (
                  <li key={sub.id} className="dashboard-subscription-item">
                    <strong>{sub.server_name}</strong>
                    <span>{getSubscriptionDisplayLabel(sub.type)}</span>
                    <span>Jusqu'au {new Date(sub.end_date).toLocaleDateString("fr-FR")}</span>
                  </li>
                ))
              ) : (
                <li>Aucun abonnement actif.</li>
              )}
            </ul>
          </article>
        </div>
      )}

      {activeSection === "settings" && (
        <div className="dashboard-layout">
          <article className="card dashboard-section">
            <div className="dashboard-section-head">
              <h2>Parametres de securite</h2>
              <p>Gestion de la double authentification et securite de connexion.</p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: twoFactorEnabled ? "#f0fdf4" : "#fef3c7",
                border: `2px solid ${twoFactorEnabled ? "#86efac" : "#fcd34d"}`,
                borderRadius: "8px",
                marginBottom: "1rem"
              }}
            >
              <div style={{ marginBottom: "0.75rem" }}>
                <strong style={{ color: twoFactorEnabled ? "#166534" : "#92400e" }}>
                  Double authentification (2FA) : {twoFactorEnabled ? "✅ Activee" : "❌ Desactivee"}
                </strong>
              </div>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#4b5563", lineHeight: "1.5" }}>
                {twoFactorEnabled
                  ? "Un code de verification vous est envoye par email a chaque connexion pour securiser votre compte."
                  : "Vous vous connectez directement sans code de verification. Activez la 2FA pour plus de securite."}
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => onToggle2FA(!twoFactorEnabled)}
                disabled={toggling2FA}
                style={{
                  backgroundColor: twoFactorEnabled ? "#dc2626" : "#16a34a",
                  color: "white",
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem"
                }}
              >
                {toggling2FA ? "Modification..." : twoFactorEnabled ? "Desactiver la 2FA" : "Activer la 2FA"}
              </button>
            </div>
          </article>

          <article className="card dashboard-section">
            <div className="dashboard-section-head">
              <h2>Reseaux sociaux</h2>
              <p>Liens publics affiches sur votre profil.</p>
            </div>
            <form className="form" onSubmit={onUpdateProfile}>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/discord/5865F2" alt="Discord icon" loading="lazy" />
                  Discord
                </span>
                <input
                  type="url"
                  value={discordUrl}
                  onChange={(event) => setDiscordUrl(event.target.value)}
                  placeholder="https://discord.com/users/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/x/000000" alt="X icon" loading="lazy" />
                  X (ex. Twitter)
                </span>
                <input type="url" value={xUrl} onChange={(event) => setXUrl(event.target.value)} placeholder="https://x.com/..." />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/bluesky/1185FE" alt="Bluesky icon" loading="lazy" />
                  Bluesky
                </span>
                <input
                  type="url"
                  value={blueskyUrl}
                  onChange={(event) => setBlueskyUrl(event.target.value)}
                  placeholder="https://bsky.app/profile/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img
                    className="social-icon"
                    src="https://cdn.bsky.app/img/avatar/plain/did:plc:qyajbfzm2uhjni6gnkgboga2/bafkreiexpqtfjezmbnttj2xjwlb42tq2qgguqdbfagik7jowoavz4kdrz4@jpeg"
                    alt="Stoat icon"
                    loading="lazy"
                  />
                  Stoat
                </span>
                <input
                  type="url"
                  value={stoatUrl}
                  onChange={(event) => setStoatUrl(event.target.value)}
                  placeholder="https://stoat.chat/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube icon" loading="lazy" />
                  YouTube
                </span>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/twitch/9146FF" alt="Twitch icon" loading="lazy" />
                  Twitch
                </span>
                <input
                  type="url"
                  value={twitchUrl}
                  onChange={(event) => setTwitchUrl(event.target.value)}
                  placeholder="https://twitch.tv/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/kick/53FC18" alt="Kick icon" loading="lazy" />
                  Kick
                </span>
                <input
                  type="url"
                  value={kickUrl}
                  onChange={(event) => setKickUrl(event.target.value)}
                  placeholder="https://kick.com/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/snapchat/FFFC00" alt="Snapchat icon" loading="lazy" />
                  Snapchat
                </span>
                <input
                  type="url"
                  value={snapchatUrl}
                  onChange={(event) => setSnapchatUrl(event.target.value)}
                  placeholder="https://snapchat.com/add/..."
                />
              </label>
              <label>
                <span className="social-label">
                  <img className="social-icon" src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok icon" loading="lazy" />
                  TikTok
                </span>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(event) => setTiktokUrl(event.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                />
              </label>
              <button className="btn" type="submit">
                Sauvegarder mes parametres
              </button>
            </form>
          </article>
        </div>
      )}

      {activeSection === "servers" && (
        <article className="card dashboard-section">
          <div className="dashboard-section-head">
            <h2>Mes serveurs ({totalServers})</h2>
            <p>Cliquez sur la banniere d'un serveur pour afficher ses details, l'edition et la promotion.</p>
          </div>

          {!data?.servers.length ? (
            <p>Aucun serveur ajoute.</p>
          ) : (
            <div className="dashboard-server-grid">
              {data.servers.map((server) => {
              const isEditing = editServerId === server.id;
              const isExpanded = expandedServerId === server.id;
              const selectedCategory = categories.find((item) => item.id === (isEditing ? editCategoryId : server.category_id));
              const isCommunity = selectedCategory ? COMMUNITY_SLUGS.has(selectedCategory.slug) : false;
              const promoteType = promoteTypeByServer[server.id] ?? "essentiel";
              const days = Math.min(30, Math.max(1, promoteDaysByServer[server.id] ?? 1));
              const hours = Math.min(24, Math.max(1, promoteHoursByServer[server.id] ?? 1));
              const totalAmount = promoteType === "essentiel" ? days * 5 : hours * 1;

              return (
                <article key={server.id} className="card dashboard-server-card">
                  <button
                    type="button"
                    className="dashboard-server-toggle"
                    onClick={() => toggleServerDetails(server.id)}
                    aria-expanded={isExpanded}
                  >
                    {server.banner_url ? (
                      <img
                        className="server-card-banner"
                        src={server.banner_url}
                        alt={`Banniere de ${server.name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="dashboard-server-banner-fallback">Aucune bannière</div>
                    )}
                    <div className="dashboard-server-head">
                      <h3 className="server-title">
                        <span>{server.name}</span>
                        {server.verified && (
                          <img
                            className="verified-icon"
                            src="https://quokka.gg/images/icons/verified-icon.svg"
                            alt="Serveur vérifié"
                            title="Serveur vérifié"
                          />
                        )}
                      </h3>
                      <span className="tag">{isExpanded ? "Masquer" : "Afficher"}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <>
                      <div className="dashboard-server-meta-grid">
                        <p className="dashboard-meta-item">
                          <strong>Catégorie</strong>
                          <span>{server.category_label}</span>
                        </p>
                        <p className="dashboard-meta-item">
                          <strong>Vues</strong>
                          <span>{server.views}</span>
                        </p>
                        <p className="dashboard-meta-item">
                          <strong>J’aime total</strong>
                          <span>{server.likes}</span>
                        </p>
                        <p className="dashboard-meta-item">
                          <strong>Visites</strong>
                          <span>{server.visits}</span>
                        </p>
                      </div>
                      <p className="server-description">{server.description}</p>

                      {isEditing ? (
                        <div className="form">
                          <label>
                            Catégorie
                            <select value={editCategoryId} onChange={(event) => setEditCategoryId(event.target.value)}>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Nom
                            <input value={editName} onChange={(event) => setEditName(event.target.value)} />
                          </label>
                          <label>
                            Description
                            <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={5} />
                          </label>
                          <label>
                            Site web
                            <input type="url" value={editWebsite} onChange={(event) => setEditWebsite(event.target.value)} />
                          </label>
                          <label>
                            Pays
                            <select value={editCountryCode} onChange={(event) => setEditCountryCode(event.target.value)}>
                              {COUNTRIES.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {isCommunity ? (
                            <label>
                              Lien d'invitation
                              <input value={editInviteLink} onChange={(event) => setEditInviteLink(event.target.value)} />
                            </label>
                          ) : (
                            <>
                              <label>
                                IP
                                <input value={editIp} onChange={(event) => setEditIp(event.target.value)} />
                              </label>
                              <label>
                                Port
                                <input
                                  type="number"
                                  value={editPort}
                                  onChange={(event) => setEditPort(Number(event.target.value))}
                                />
                              </label>
                            </>
                          )}
                          <label>
                            Banniere (Imgur)
                            <input type="url" value={editBannerUrl} onChange={(event) => setEditBannerUrl(event.target.value)} />
                          </label>
                          <label className="inline-control">
                            <input
                              type="checkbox"
                              checked={editIsPublic}
                              onChange={(event) => setEditIsPublic(event.target.checked)}
                            />
                            Serveur public
                          </label>
                          <div className="server-card-actions">
                            <button className="btn" type="button" onClick={() => void onSaveServer(server.id)}>
                              Sauvegarder
                            </button>
                            <button className="btn btn-ghost" type="button" onClick={stopEdit}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="server-card-actions">
                          <button className="btn" type="button" onClick={() => startEdit(server)}>
                            Éditer
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => void onDeleteServer(server.id)}>
                            Supprimer
                          </button>
                        </div>
                      )}

                      <div className="server-promote-box">
                        <h4 className="promote-title">Paiement abonnement</h4>
                        <p className="dashboard-muted">Choisissez une offre, sa durée, puis continuez vers Stripe.</p>
                        <div className="promote-plan-switch">
                          <button
                            type="button"
                            className={`promote-plan-btn ${promoteType === "essentiel" ? "active" : ""}`}
                            onClick={() =>
                              setPromoteTypeByServer((current) => ({
                                ...current,
                                [server.id]: "essentiel"
                              }))
                            }
                          >
                            Quokka Essentiel
                            <small>5 EUR / jour</small>
                          </button>
                          <button
                            type="button"
                            className={`promote-plan-btn ${promoteType === "quokka_plus" ? "active" : ""}`}
                            onClick={() =>
                              setPromoteTypeByServer((current) => ({
                                ...current,
                                [server.id]: "quokka_plus"
                              }))
                            }
                          >
                            Quokka+
                            <small>1 EUR / heure</small>
                          </button>
                        </div>

                        <ul className="list">
                          {promoteType === "essentiel" ? (
                            <>
                              <li>Badge Quokka Essentiel</li>
                              <li>En seconde position sur la homepage</li>
                              <li>En seconde position dans la catégorie du serveur</li>
                            </>
                          ) : (
                            <>
                              <li>Badge Quokka+</li>
                              <li>Tout en haut de la homepage</li>
                              <li>Tout en haut dans la catégorie du serveur</li>
                            </>
                          )}
                        </ul>
                        <div className="promote-grid">
                          {promoteType === "essentiel" ? (
                            <>
                              <label className="promote-field">
                                Durée (jours)
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={days}
                                  onChange={(event) =>
                                    setPromoteDaysByServer((current) => ({
                                      ...current,
                                      [server.id]: Number(event.target.value)
                                    }))
                                  }
                                />
                              </label>
                              <label className="promote-field">
                                Date de début
                                <input
                                  type="date"
                                  value={promoteStartDateByServer[server.id] ?? ""}
                                  onChange={(event) =>
                                    setPromoteStartDateByServer((current) => ({
                                      ...current,
                                      [server.id]: event.target.value
                                    }))
                                  }
                                />
                              </label>
                            </>
                          ) : (
                            <label className="promote-field">
                              Durée (heures)
                              <input
                                type="number"
                                min={1}
                                max={24}
                                value={hours}
                                onChange={(event) =>
                                  setPromoteHoursByServer((current) => ({
                                    ...current,
                                    [server.id]: Number(event.target.value)
                                  }))
                                }
                              />
                            </label>
                          )}
                        </div>
                        <div className="promote-total">
                          <strong>Total estimé :</strong> {formatAmountEur(totalAmount)}
                        </div>
                        <div className="server-card-actions">
                          <button className="btn" type="button" onClick={() => void onPromoteServer(server.id)}>
                            Payer {formatAmountEur(totalAmount)}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              );
              })}
            </div>
          )}
        </article>
      )}
    </section>
  );
}
