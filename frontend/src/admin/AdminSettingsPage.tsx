import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";

type MaintenanceResponse = {
  maintenance: {
    is_enabled: boolean;
    message: string;
  };
};

export function AdminSettingsPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("Le site est en maintenance.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<MaintenanceResponse>("/maintenance");
        setIsEnabled(result.maintenance?.is_enabled ?? false);
        setMessage(result.maintenance?.message ?? "Le site est en maintenance.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chargement des paramètres impossible.");
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<{ message: string }>("/maintenance", {
        method: "PATCH",
        token,
        body: { isEnabled, message }
      });
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
            <input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} />
            Activer le mode maintenance
          </label>
          <label>
            Message affiché aux visiteurs
            <textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </article>
    </div>
  );
}
