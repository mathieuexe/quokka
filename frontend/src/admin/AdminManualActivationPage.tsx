import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Server } from "../types";

type ServersResponse = { servers: Server[] };

export function AdminManualActivationPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [serverId, setServerId] = useState("");
  const [type, setType] = useState<"quokka_plus" | "essentiel">("quokka_plus");
  const [durationDays, setDurationDays] = useState(30);
  const [durationHours, setDurationHours] = useState(12);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServers(): Promise<void> {
      if (!token) return;
      setError(null);
      try {
        const result = await apiRequest<ServersResponse>("/admin/servers", { token });
        setServers(result.servers);
        if (result.servers.length > 0) {
          setServerId((current) => current || result.servers[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger les serveurs.");
      }
    }
    void loadServers();
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !serverId) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest<{ message: string }>("/admin/servers/promote", {
        method: "POST",
        token,
        body: {
          serverId,
          type,
          ...(type === "essentiel"
            ? { durationDays: Math.min(365, Math.max(1, durationDays)) }
            : { durationHours: Math.min(24 * 365, Math.max(1, durationHours)) })
        }
      });
      showToast("Abonnement activé manuellement.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Activation manuelle d’abonnement</h2>
        <p>Active un abonnement sur un serveur sans passer par un paiement Stripe.</p>
      </div>

      <article className="card">
        <form className="form" onSubmit={onSubmit}>
          {error && <p className="error-text">{error}</p>}
          <label>
            Serveur
            <select value={serverId} onChange={(event) => setServerId(event.target.value)}>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} - {server.user_pseudo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type d’abonnement
            <select value={type} onChange={(event) => setType(event.target.value as "quokka_plus" | "essentiel")}>
              <option value="quokka_plus">Quokka+</option>
              <option value="essentiel">Quokka Essentiel</option>
            </select>
          </label>
          {type === "essentiel" ? (
            <label>
              Durée (jours)
              <input
                type="number"
                min={1}
                max={365}
                value={durationDays}
                onChange={(event) => setDurationDays(Number(event.target.value))}
              />
            </label>
          ) : (
            <label>
              Durée (heures)
              <input
                type="number"
                min={1}
                max={24 * 365}
                value={durationHours}
                onChange={(event) => setDurationHours(Number(event.target.value))}
              />
            </label>
          )}
          <p className="dashboard-muted">
            {type === "essentiel"
              ? "Essentiel fonctionne en jours."
              : "Quokka+ fonctionne en heures."}
          </p>
          <button className="btn" type="submit" disabled={saving || !serverId}>
            {saving ? "Activation..." : "Activer sans paiement"}
          </button>
        </form>
      </article>
    </div>
  );
}
