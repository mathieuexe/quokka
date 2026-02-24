import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getMaintenanceSettings, updateMaintenanceSettings, MaintenanceSettings } from "../lib/api";

export function AdminSettingsPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<MaintenanceSettings>({ is_enabled: false, message: "", allowed_ips: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getMaintenanceSettings(token);
        setSettings(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chargement des paramètres impossible.");
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
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement des paramètres...</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Paramétrage du site</h2>
        <p>Page dédiée à la configuration globale, avec gestion du mode maintenance.</p>
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
    </div>
  );
}
