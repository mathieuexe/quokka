import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Server } from "../types";

type ServersResponse = { servers: Server[] };

export function AdminServersPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "quokka_plus" | "essentiel" | "none">("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadServers(): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const result = await apiRequest<ServersResponse>(`/admin/servers${query}`, { token });
      setServers(result.servers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les serveurs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServers();
  }, [token]);

  const filteredServers = useMemo(() => {
    const value = search.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesSearch =
        server.name.toLowerCase().includes(value) ||
        server.user_pseudo.toLowerCase().includes(value) ||
        server.category_label.toLowerCase().includes(value);
      const matchesVisibility =
        visibilityFilter === "all"
          ? true
          : visibilityFilter === "visible"
            ? server.is_visible
            : !server.is_visible;
      const matchesVerified =
        verifiedFilter === "all"
          ? true
          : verifiedFilter === "verified"
            ? server.verified
            : !server.verified;
      const matchesPremium =
        premiumFilter === "all"
          ? true
          : premiumFilter === "none"
            ? server.premium_type == null
            : server.premium_type === premiumFilter;
      const createdAt = new Date(server.created_at).getTime();
      const fromOk = createdFrom ? createdAt >= new Date(`${createdFrom}T00:00:00`).getTime() : true;
      const toOk = createdTo ? createdAt <= new Date(`${createdTo}T23:59:59`).getTime() : true;
      return matchesSearch && matchesVisibility && matchesVerified && matchesPremium && fromOk && toOk;
    });
  }, [servers, search, visibilityFilter, verifiedFilter, premiumFilter, createdFrom, createdTo]);

  const totalPages = Math.max(1, Math.ceil(filteredServers.length / pageSize));
  const paginatedServers = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredServers.slice(start, start + pageSize);
  }, [filteredServers, page, pageSize, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, visibilityFilter, verifiedFilter, premiumFilter, createdFrom, createdTo, pageSize]);

  async function setVisibility(serverId: string, value: boolean): Promise<void> {
    if (!token) return;
    try {
      await apiRequest<{ message: string }>("/admin/servers/visible", {
        method: "PATCH",
        token,
        body: { serverId, value }
      });
      showToast(value ? "Serveur rendu visible." : "Serveur retiré de la visibilité.");
      await loadServers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action de visibilité impossible.");
    }
  }

  async function setHidden(serverId: string, value: boolean): Promise<void> {
    if (!token) return;
    try {
      await apiRequest<{ message: string }>("/admin/servers/hide", {
        method: "PATCH",
        token,
        body: { serverId, value }
      });
      showToast(value ? "Serveur masqué." : "Serveur démasqué.");
      await loadServers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action de masquage impossible.");
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Tous les serveurs</h2>
        <p>Page dédiée pour contrôler la visibilité et consulter les informations de chaque serveur.</p>
      </div>

      <article className="card admin-kpi-grid">
        <div className="admin-kpi-box">
          <span>Total filtré</span>
          <strong>{filteredServers.length}</strong>
        </div>
        <div className="admin-kpi-box">
          <span>Visibles</span>
          <strong>{filteredServers.filter((server) => server.is_visible).length}</strong>
        </div>
        <div className="admin-kpi-box">
          <span>Vérifiés</span>
          <strong>{filteredServers.filter((server) => server.verified).length}</strong>
        </div>
      </article>

      <article className="card admin-filter-grid">
        <label>
          Recherche
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, propriétaire, catégorie..." />
        </label>
        <label>
          Visibilité
          <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as "all" | "visible" | "hidden")}>
            <option value="all">Toutes</option>
            <option value="visible">Visible</option>
            <option value="hidden">Non visible</option>
          </select>
        </label>
        <label>
          Vérification
          <select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value as "all" | "verified" | "unverified")}>
            <option value="all">Tous</option>
            <option value="verified">Vérifié</option>
            <option value="unverified">Non vérifié</option>
          </select>
        </label>
        <label>
          Premium
          <select
            value={premiumFilter}
            onChange={(event) => setPremiumFilter(event.target.value as "all" | "quokka_plus" | "essentiel" | "none")}
          >
            <option value="all">Tous</option>
            <option value="quokka_plus">Quokka+</option>
            <option value="essentiel">Essentiel</option>
            <option value="none">Aucun</option>
          </select>
        </label>
        <label>
          Créé après
          <input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} />
        </label>
        <label>
          Créé avant
          <input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} />
        </label>
        <label>
          Par page
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </article>

      {loading ? (
        <p>Chargement des serveurs...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="admin-table-wrap">
          {paginatedServers.map((server) => (
            <article key={server.id} className="admin-list-item static">
              <div>
                <h3>{server.name}</h3>
                <p>
                  Ref #{server.reference_number} — Propriétaire : {server.user_pseudo} - {server.category_label}
                </p>
              </div>
              <div className="admin-list-item-meta">
                <span className={`status-pill ${server.is_visible ? "status-paid" : "status-failed"}`}>
                  {server.is_visible ? "Visible" : "Non visible"}
                </span>
                <span className={`status-pill ${server.is_hidden ? "status-pending" : "status-paid"}`}>
                  {server.is_hidden ? "Masqué" : "Non masqué"}
                </span>
                <span className={`status-pill ${server.verified ? "status-paid" : "status-failed"}`}>
                  {server.verified ? "Vérifié" : "Non vérifié"}
                </span>
                <button className="btn btn-ghost" type="button" onClick={() => void setVisibility(server.id, !server.is_visible)}>
                  {server.is_visible ? "Retirer de la liste" : "Rendre visible"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => void setHidden(server.id, !server.is_hidden)}>
                  {server.is_hidden ? "Démasquer" : "Masquer"}
                </button>
                <Link className="btn" to={`/servers/${server.id}`}>
                  Voir le serveur
                </Link>
              </div>
            </article>
          ))}
          {filteredServers.length === 0 && <p>Aucun serveur trouvé.</p>}
          <div className="admin-pagination">
            <button className="btn btn-ghost" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Précédent
            </button>
            <span>
              Page {Math.min(page, totalPages)} / {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
