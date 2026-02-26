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
  ApiError,
  MaintenanceSettings,
  AnnouncementSettings,
  SiteBrandingSettings
} from "../lib/api";

export function AdminSettingsPage(): JSX.Element {
  const { token, logout } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<MaintenanceSettings>({ is_enabled: false, message: "", allowed_ips: "" });
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
      } else if (e instanceof ApiError && e.status === 404) {
        setBrandingError("Endpoint API introuvable. Vérifiez VITE_API_URL.");
      } else {
        setBrandingError(e instanceof Error ? e.message : "Mise à jour impossible.");
      }
    } finally {
      setBrandingSaving(false);
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
    </div>
  );
}
