import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import type { User } from "../types";

type UsersResponse = { users: User[] };

export function AdminUsersPage(): JSX.Element {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [emailFilter, setEmailFilter] = useState<"all" | "verified" | "unverified">("all");
  const [twoFactorFilter, setTwoFactorFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<UsersResponse>("/admin/users", { token });
        setUsers(result.users);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    }
    void loadUsers();
  }, [token]);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();
    return users.filter((entry) => {
      const matchesSearch =
        entry.pseudo.toLowerCase().includes(value) ||
        entry.email.toLowerCase().includes(value) ||
        entry.role.toLowerCase().includes(value) ||
        (entry.language ?? "").toLowerCase().includes(value);
      const matchesRole = roleFilter === "all" ? true : entry.role === roleFilter;
      const matchesEmail =
        emailFilter === "all"
          ? true
          : emailFilter === "verified"
            ? entry.email_verified === true
            : entry.email_verified !== true;
      const matchesTwoFactor =
        twoFactorFilter === "all"
          ? true
          : twoFactorFilter === "enabled"
            ? entry.two_factor_enabled === true
            : entry.two_factor_enabled !== true;
      const matchesLanguage = languageFilter === "all" ? true : (entry.language ?? "fr") === languageFilter;

      const createdAt = entry.created_at ? new Date(entry.created_at).getTime() : null;
      const fromOk = createdFrom ? (createdAt ? createdAt >= new Date(`${createdFrom}T00:00:00`).getTime() : false) : true;
      const toOk = createdTo ? (createdAt ? createdAt <= new Date(`${createdTo}T23:59:59`).getTime() : false) : true;

      return matchesSearch && matchesRole && matchesEmail && matchesTwoFactor && matchesLanguage && fromOk && toOk;
    });
  }, [users, search, roleFilter, emailFilter, twoFactorFilter, languageFilter, createdFrom, createdTo]);

  const languageOptions = useMemo(() => {
    const langs = new Set<string>();
    users.forEach((entry) => langs.add(entry.language ?? "fr"));
    return Array.from(langs).sort();
  }, [users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, emailFilter, twoFactorFilter, languageFilter, createdFrom, createdTo, pageSize]);

  const verifiedCount = filteredUsers.filter((entry) => entry.email_verified === true).length;
  const adminCount = filteredUsers.filter((entry) => entry.role === "admin").length;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Tous les utilisateurs</h2>
        <p>Clique sur un utilisateur pour ouvrir sa fiche complète et ses serveurs.</p>
      </div>

      <article className="card admin-kpi-grid">
        <div className="admin-kpi-box">
          <span>Résultat filtré</span>
          <strong>{filteredUsers.length}</strong>
        </div>
        <div className="admin-kpi-box">
          <span>Emails vérifiés</span>
          <strong>{verifiedCount}</strong>
        </div>
        <div className="admin-kpi-box">
          <span>Admins</span>
          <strong>{adminCount}</strong>
        </div>
      </article>

      <article className="card admin-filter-grid">
        <label>
          Rechercher
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pseudo, email, rôle, langue..." />
        </label>
        <label>
          Rôle
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | "admin" | "user")}>
            <option value="all">Tous</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </label>
        <label>
          Email
          <select
            value={emailFilter}
            onChange={(event) => setEmailFilter(event.target.value as "all" | "verified" | "unverified")}
          >
            <option value="all">Tous</option>
            <option value="verified">Vérifié</option>
            <option value="unverified">Non vérifié</option>
          </select>
        </label>
        <label>
          2FA
          <select
            value={twoFactorFilter}
            onChange={(event) => setTwoFactorFilter(event.target.value as "all" | "enabled" | "disabled")}
          >
            <option value="all">Tous</option>
            <option value="enabled">Activée</option>
            <option value="disabled">Désactivée</option>
          </select>
        </label>
        <label>
          Langue
          <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)}>
            <option value="all">Toutes</option>
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
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
        <p>Chargement des utilisateurs...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="admin-table-wrap">
          {paginatedUsers.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="admin-list-item"
              onClick={() => navigate(`/admin/users/${entry.id}`)}
            >
              <div>
                <h3>{entry.pseudo}</h3>
                <p>{entry.email}</p>
                {entry.customer_reference && <p>Réf client : {entry.customer_reference}</p>}
              </div>
              <div className="admin-list-item-meta">
                <span className={`status-pill ${entry.email_verified ? "status-paid" : "status-failed"}`}>
                  {entry.email_verified ? "Email vérifié" : "Email non vérifié"}
                </span>
                <span className={`status-pill ${entry.two_factor_enabled ? "status-paid" : "status-pending"}`}>
                  {entry.two_factor_enabled ? "2FA ON" : "2FA OFF"}
                </span>
                <span className="tag">{entry.role}</span>
                <span className="tag">{(entry.language ?? "fr").toUpperCase()}</span>
              </div>
            </button>
          ))}
          {filteredUsers.length === 0 && <p>Aucun utilisateur trouvé.</p>}
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
