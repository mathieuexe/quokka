import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getMaintenanceSettings,
  updateMaintenanceSettings,
  getAnnouncementSettings,
  updateAnnouncementSettings,
  getSiteBrandingSettings,
  updateSiteBrandingSettings,
  apiRequest,
  ApiError,
  MaintenanceSettings,
  AnnouncementSettings,
  SiteBrandingSettings
} from "../lib/api";
import type { Category } from "../types";

type CategoriesResponse = { categories: Category[] };

export function AdminSettingsPage(): JSX.Element {
  const { token, logout } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<MaintenanceSettings>({
    is_enabled: false,
    message: "",
    allowed_ips: "",
    discord_auth_enabled: false,
    discord_auth_message: ""
  });
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    is_enabled: false,
    text: "",
    icon: "",
    cta_label: "",
    cta_url: "",
    countdown_target: ""
  });
  const [branding, setBranding] = useState<SiteBrandingSettings>({
    site_title: "",
    site_description: "",
    logo_url: "",
    favicon_url: ""
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [fakeUsersCount, setFakeUsersCount] = useState(5);
  const [fakeServersCount, setFakeServersCount] = useState(3);
  const [fakeServerTitle, setFakeServerTitle] = useState("Serveur de test");
  const [fakeServerDescription, setFakeServerDescription] = useState("Description de test pour remplir l'annuaire.");
  const [fakeServerImageUrl, setFakeServerImageUrl] = useState("");
  const [fakeCategoryId, setFakeCategoryId] = useState("");
  const [fakeSaving, setFakeSaving] = useState(false);
  const [fakeDeleting, setFakeDeleting] = useState(false);
  const [fakeError, setFakeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  const iconOptions = [
    { value: "sparkles", label: "✨ Étincelles" },
    { value: "megaphone", label: "📣 Annonce" },
    { value: "rocket", label: "🚀 Lancement" },
    { value: "warning", label: "⚠️ Alerte" },
    { value: "gift", label: "🎁 Offre" },
    { value: "bell", label: "🔔 Info" }
  ];
  const defaultAnnouncementIcon = iconOptions[0]?.value ?? "";

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      setAnnouncementError(null);
      setBrandingError(null);
      try {
        const [maintenanceResult, announcementResult, brandingResult] = await Promise.all([
          getMaintenanceSettings(token),
          getAnnouncementSettings(token),
          getSiteBrandingSettings(token)
        ]);
        setSettings(maintenanceResult);
        setAnnouncement({
          ...announcementResult,
          icon:
            announcementResult.is_enabled && !announcementResult.icon.trim()
              ? defaultAnnouncementIcon
              : announcementResult.icon
        });
        setBranding(brandingResult);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          logout();
          showToast("Session expirée. Merci de vous reconnecter.");
          setError("Authentification requise.");
        } else if (e instanceof ApiError && e.status === 404) {
          setError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
        } else {
          setError(e instanceof Error ? e.message : "Chargement des paramètres impossible.");
        }
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, [token]);

  useEffect(() => {
    async function loadCategories(): Promise<void> {
      setFakeError(null);
      try {
        const result = await apiRequest<CategoriesResponse>("/categories");
        setCategories(result.categories);
        if (!fakeCategoryId && result.categories.length > 0) {
          setFakeCategoryId(result.categories[0].id);
        }
      } catch (e) {
        setFakeError(e instanceof Error ? e.message : "Chargement des catégories impossible.");
      }
    }
    void loadCategories();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateMaintenanceSettings(token, settings);
      showToast("Paramètres de maintenance enregistrés.");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        logout();
        showToast("Session expirée. Merci de vous reconnecter.");
        setError("Authentification requise.");
      } else if (e instanceof ApiError && typeof e.data === "object" && e.data !== null && "issues" in e.data) {
        const issues = (e.data as { issues?: { message?: string }[] }).issues ?? [];
        setError(issues.map((issue) => issue.message).filter(Boolean).join(" • ") || "Données invalides.");
      } else if (e instanceof ApiError && e.status === 404) {
        setError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
      } else {
        setError(e instanceof Error ? e.message : "Mise à jour impossible.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onAnnouncementSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setAnnouncementSaving(true);
    setAnnouncementError(null);
    try {
      const payload = {
        ...announcement,
        icon:
          announcement.is_enabled && !announcement.icon.trim()
            ? defaultAnnouncementIcon
            : announcement.icon
      };
      const result = await updateAnnouncementSettings(token, payload);
      setAnnouncement(result.announcement);
      showToast("Bandeau d'information enregistré.");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        logout();
        showToast("Session expirée. Merci de vous reconnecter.");
        setAnnouncementError("Authentification requise.");
      } else if (e instanceof ApiError && typeof e.data === "object" && e.data !== null && "issues" in e.data) {
        const issues = (e.data as { issues?: { message?: string }[] }).issues ?? [];
        setAnnouncementError(issues.map((issue) => issue.message).filter(Boolean).join(" • ") || "Données invalides.");
      } else if (e instanceof ApiError && e.status === 404) {
        setAnnouncementError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
      } else {
        setAnnouncementError(e instanceof Error ? e.message : "Mise à jour impossible.");
      }
    } finally {
      setAnnouncementSaving(false);
    }
  }

  async function onBrandingSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setBrandingSaving(true);
    setBrandingError(null);
    try {
      await updateSiteBrandingSettings(token, branding);
      showToast("Identité du site enregistrée.");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        logout();
        showToast("Session expirée. Merci de vous reconnecter.");
        setBrandingError("Authentification requise.");
      } else if (e instanceof ApiError && typeof e.data === "object" && e.data !== null && "issues" in e.data) {
        const issues = (e.data as { issues?: { message?: string }[] }).issues ?? [];
        setBrandingError(issues.map((issue) => issue.message).filter(Boolean).join(" • ") || "Données invalides.");
      } else if (e instanceof ApiError && e.status === 404) {
        setBrandingError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
      } else {
        setBrandingError(e instanceof Error ? e.message : "Mise à jour impossible.");
      }
    } finally {
      setBrandingSaving(false);
    }
  }

  async function onFakeSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setFakeSaving(true);
    setFakeError(null);
    try {
      await apiRequest("/admin/fakes", {
        method: "POST",
        token,
        body: {
          usersCount: fakeUsersCount,
          serversCount: fakeServersCount,
          serverTitle: fakeServerTitle,
          serverDescription: fakeServerDescription,
          serverImageUrl: fakeServerImageUrl,
          categoryId: fakeCategoryId || undefined
        }
      });
      showToast("Données fictives créées.");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        logout();
        showToast("Session expirée. Merci de vous reconnecter.");
        setFakeError("Authentification requise.");
      } else if (e instanceof ApiError && typeof e.data === "object" && e.data !== null && "issues" in e.data) {
        const issues = (e.data as { issues?: { message?: string }[] }).issues ?? [];
        setFakeError(issues.map((issue) => issue.message).filter(Boolean).join(" • ") || "Données invalides.");
      } else if (e instanceof ApiError && e.status === 404) {
        setFakeError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
      } else {
        setFakeError(e instanceof Error ? e.message : "Création impossible.");
      }
    } finally {
      setFakeSaving(false);
    }
  }

  async function onDeleteFake(): Promise<void> {
    if (!token) return;
    setFakeDeleting(true);
    setFakeError(null);
    try {
      await apiRequest("/admin/fakes", { method: "DELETE", token });
      showToast("Données fictives supprimées.");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        logout();
        showToast("Session expirée. Merci de vous reconnecter.");
        setFakeError("Authentification requise.");
      } else if (e instanceof ApiError && e.status === 404) {
        setFakeError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
      } else {
        setFakeError(e instanceof Error ? e.message : "Suppression impossible.");
      }
    } finally {
      setFakeDeleting(false);
    }
  }

  const announcementCtaEnabled = Boolean(announcement.cta_label.trim() || announcement.cta_url.trim());

  if (loading) return <p>Chargement des paramètres...</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Paramétrage du site</h2>
        <p>Page dédiée à la configuration globale, avec maintenance et bandeau d'information.</p>
      </div>

      <article className="card">
        <form className="form" onSubmit={onSubmit}>
          {error && <p className="error-text">{error}</p>}
          <label className="inline-control">
            <input
              type="checkbox"
              checked={settings.is_enabled}
              onChange={(event) => setSettings({ ...settings, is_enabled: event.target.checked })}
            />
            Activer le mode maintenance
          </label>
          <label>
            Message affiché aux visiteurs
            <textarea
              rows={5}
              value={settings.message}
              onChange={(event) => setSettings({ ...settings, message: event.target.value })}
            />
          </label>
          <label>
            Adresses IP autorisées (séparées par des virgules)
            <textarea
              rows={2}
              value={settings.allowed_ips}
              onChange={(event) => setSettings({ ...settings, allowed_ips: event.target.value })}
            />
          </label>
          <label className="inline-control">
            <input
              type="checkbox"
              checked={settings.discord_auth_enabled}
              onChange={(event) => setSettings({ ...settings, discord_auth_enabled: event.target.checked })}
            />
            Mettre la connexion Discord en maintenance
          </label>
          <label>
            Message de maintenance pour la connexion Discord
            <textarea
              rows={3}
              value={settings.discord_auth_message}
              onChange={(event) => setSettings({ ...settings, discord_auth_message: event.target.value })}
            />
          </label>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </article>

      <article className="card">
        <form className="form" onSubmit={onBrandingSubmit}>
          <h3>Identité du site</h3>
          {brandingError && <p className="error-text">{brandingError}</p>}
          <label>
            Titre du site
            <input
              value={branding.site_title}
              onChange={(event) => setBranding({ ...branding, site_title: event.target.value })}
              placeholder="Quokka"
            />
          </label>
          <label>
            Description du site
            <textarea
              rows={3}
              value={branding.site_description}
              onChange={(event) => setBranding({ ...branding, site_description: event.target.value })}
              placeholder="Annuaire et classement de serveurs."
            />
          </label>
          <label>
            URL du logo
            <input
              value={branding.logo_url}
              onChange={(event) => setBranding({ ...branding, logo_url: event.target.value })}
              placeholder="https://... ou /images/logo.png"
            />
          </label>
          <label>
            URL du favicon
            <input
              value={branding.favicon_url}
              onChange={(event) => setBranding({ ...branding, favicon_url: event.target.value })}
              placeholder="https://... ou /images/favicon.png"
            />
          </label>
          <button className="btn" type="submit" disabled={brandingSaving}>
            {brandingSaving ? "Enregistrement..." : "Enregistrer l'identité"}
          </button>
        </form>
      </article>

      <article className="card">
        <form className="form" onSubmit={onAnnouncementSubmit}>
          <h3>Bandeau d'information</h3>
          {announcementError && <p className="error-text">{announcementError}</p>}
          <label className="inline-control">
            <input
              type="checkbox"
              checked={announcement.is_enabled}
              onChange={(event) => {
                const isEnabled = event.target.checked;
                setAnnouncement({
                  ...announcement,
                  is_enabled: isEnabled,
                  icon: isEnabled && !announcement.icon.trim() ? defaultAnnouncementIcon : announcement.icon
                });
              }}
            />
            Activer le bandeau
          </label>
          <label>
            Texte
            <textarea
              rows={3}
              value={announcement.text}
              onChange={(event) => setAnnouncement({ ...announcement, text: event.target.value })}
              placeholder="Ex: Nouvelle version disponible aujourd'hui."
              maxLength={500}
              required={announcement.is_enabled}
            />
          </label>
          <label>
            Icône
            <select
              value={announcement.icon}
              onChange={(event) => setAnnouncement({ ...announcement, icon: event.target.value })}
              required={announcement.is_enabled}
            >
              {iconOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bouton d'action
            <label className="inline-control" style={{ marginTop: "0.4rem" }}>
              <input
                type="checkbox"
                checked={announcementCtaEnabled}
                onChange={(event) => {
                  if (!event.target.checked) {
                    setAnnouncement({ ...announcement, cta_label: "", cta_url: "" });
                  }
                }}
              />
              Ajouter un bouton (optionnel)
            </label>
          </label>
          {announcementCtaEnabled && (
            <>
              <label>
                Texte du bouton
                <input
                  value={announcement.cta_label}
                  onChange={(event) => setAnnouncement({ ...announcement, cta_label: event.target.value })}
                  placeholder="Ex: Découvrir"
                />
              </label>
              <label>
                Lien du bouton
                <input
                  value={announcement.cta_url}
                  onChange={(event) => setAnnouncement({ ...announcement, cta_url: event.target.value })}
                  placeholder="https://... ou /offres"
                />
              </label>
            </>
          )}
          <label>
            Compte à rebours (optionnel)
            <input
              type="datetime-local"
              value={announcement.countdown_target}
              onChange={(event) => setAnnouncement({ ...announcement, countdown_target: event.target.value })}
            />
          </label>
          <button className="btn" type="submit" disabled={announcementSaving}>
            {announcementSaving ? "Enregistrement..." : "Enregistrer le bandeau"}
          </button>
        </form>
      </article>

      <article className="card">
        <form className="form" onSubmit={onFakeSubmit}>
          <h3>Données fictives</h3>
          {fakeError && <p className="error-text">{fakeError}</p>}
          <div className="form-grid">
            <label>
              Nombre d'utilisateurs
              <input
                type="number"
                min={0}
                max={100}
                value={fakeUsersCount}
                onChange={(event) => setFakeUsersCount(Number(event.target.value))}
              />
            </label>
            <label>
              Nombre de serveurs
              <input
                type="number"
                min={0}
                max={100}
                value={fakeServersCount}
                onChange={(event) => setFakeServersCount(Number(event.target.value))}
              />
            </label>
          </div>
          <label>
            Titre du serveur
            <input
              value={fakeServerTitle}
              onChange={(event) => setFakeServerTitle(event.target.value)}
              placeholder="Serveur de test"
            />
          </label>
          <label>
            Description du serveur
            <textarea
              rows={3}
              value={fakeServerDescription}
              onChange={(event) => setFakeServerDescription(event.target.value)}
              placeholder="Description de test"
            />
          </label>
          <label>
            Image du serveur (URL)
            <input
              value={fakeServerImageUrl}
              onChange={(event) => setFakeServerImageUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            Catégorie
            <select
              value={fakeCategoryId}
              onChange={(event) => setFakeCategoryId(event.target.value)}
              disabled={categories.length === 0}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={fakeSaving}>
              {fakeSaving ? "Création..." : "Créer les fakes"}
            </button>
            <button className="btn btn-outline" type="button" onClick={onDeleteFake} disabled={fakeDeleting}>
              {fakeDeleting ? "Suppression..." : "Supprimer les fakes"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
