import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type CertificationRequest = {
  id: string;
  server_id: string;
  user_id: string;
  presentation: string;
  social_links: string | null;
  attachments: string[];
  status: "pending" | "accepted" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  server_name: string;
  user_pseudo: string;
};

export function AdminCertificationsPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<CertificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function loadRequests(): Promise<void> {
    if (!token) return;
    setLoading(true);
    try {
      const url = filter === "all" ? "/admin/certifications" : "/admin/certifications?status=pending";
      const data = await apiRequest<{ requests: CertificationRequest[] }>(url, { token });
      setRequests(data.requests);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [token, filter]);

  async function handleAccept(id: string): Promise<void> {
    if (!token || !window.confirm("Accepter cette demande de certification ? Le serveur sera marqué comme certifié.")) return;
    try {
      const res = await apiRequest<{ message: string }>(`/admin/certifications/${id}/accept`, {
        method: "POST",
        token
      });
      showToast(res.message);
      void loadRequests();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function handleReject(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!token || !rejectingId) return;
    try {
      const res = await apiRequest<{ message: string }>(`/admin/certifications/${rejectingId}/reject`, {
        method: "POST",
        token,
        body: { reason: rejectReason }
      });
      showToast(res.message);
      setRejectingId(null);
      setRejectReason("");
      void loadRequests();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Demandes de certification</h2>
        <p>Gérez les demandes de certification de serveurs.</p>
      </div>

      <div className="admin-filters" style={{ marginBottom: "1rem" }}>
        <button
          className={`btn ${filter === "pending" ? "" : "btn-ghost"}`}
          onClick={() => setFilter("pending")}
        >
          En attente
        </button>
        <button
          className={`btn ${filter === "all" ? "" : "btn-ghost"}`}
          onClick={() => setFilter("all")}
          style={{ marginLeft: "0.5rem" }}
        >
          Toutes
        </button>
      </div>

      <div className="admin-list-grid">
        {requests.length === 0 ? (
          <p>Aucune demande trouvée.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="admin-list-item" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "0.5rem" }}>
                <div>
                  <strong style={{ fontSize: "1.1rem" }}>{req.server_name}</strong> par {req.user_pseudo}
                  <span className="tag" style={{ marginLeft: "0.5rem" }}>{req.status}</span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  {new Date(req.created_at).toLocaleString("fr-FR")}
                </div>
              </div>
              
              <div style={{ background: "var(--surface-1)", padding: "1rem", borderRadius: "8px", width: "100%", marginBottom: "0.5rem" }}>
                <p style={{ whiteSpace: "pre-wrap", margin: "0 0 1rem 0" }}>{req.presentation}</p>
                {req.social_links && (
                  <p><strong>Réseaux / Article :</strong> {req.social_links}</p>
                )}
                {req.attachments && req.attachments.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <strong>Pièces jointes :</strong>
                    <ul style={{ margin: "0.2rem 0 0", paddingLeft: "1.2rem" }}>
                      {req.attachments.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {req.status === "pending" && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button className="btn" style={{ background: "#16a34a", color: "white", borderColor: "transparent" }} onClick={() => handleAccept(req.id)}>
                    Accepter
                  </button>
                  <button className="btn" style={{ background: "#dc2626", color: "white", borderColor: "transparent" }} onClick={() => setRejectingId(req.id)}>
                    Refuser
                  </button>
                </div>
              )}
              {req.status === "rejected" && req.rejection_reason && (
                <div style={{ marginTop: "0.5rem", color: "#dc2626" }}>
                  <strong>Motif du refus :</strong> {req.rejection_reason}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {rejectingId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <h3>Refuser la demande</h3>
            <form onSubmit={handleReject} className="form">
              <label>
                Motif du refus (visible par l'utilisateur)
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  rows={4}
                />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ background: "#dc2626", color: "white", borderColor: "transparent" }}>
                  Confirmer le refus
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setRejectingId(null)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
