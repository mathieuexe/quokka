import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

type Ticket = {
  id: string;
  reference: string;
  user_id: string;
  user_pseudo: string;
  assigned_admin_id: string | null;
  assigned_admin_pseudo: string | null;
  status: string;
  priority: number;
  category: string;
  subcategory: string | null;
  server_name: string | null;
  server_url: string | null;
  created_at: string;
  last_message_at: string;
};

type TicketMessage = {
  id: string;
  author_role: "user" | "admin";
  message: string;
  attachments: string[];
  created_at: string;
  user_pseudo: string | null;
  admin_pseudo: string | null;
};

type AdminUser = {
  id: string;
  pseudo: string;
  role: "user" | "admin";
};

type TicketsResponse = {
  tickets: Ticket[];
};

type TicketDetailResponse = {
  ticket: Ticket;
  messages: TicketMessage[];
};

type UsersResponse = {
  users: AdminUser[];
};

const STATUSES = [
  "En attente d’attribution",
  "Ouvert",
  "En attente utilisateur",
  "En cours",
  "En investigation",
  "Résolu",
  "Clôturé"
];

const CATEGORY_CONFIG = [
  {
    label: "Support technique",
    priority: 9,
    subcategories: [
      "Bug sur le site",
      "Problème de connexion / compte",
      "Erreur lors de l’ajout d’un serveur",
      "Problème d’API / vote / bot",
      "Signalement de crash"
    ]
  },
  {
    label: "Demande de référencement / modification serveur",
    priority: 6,
    subcategories: ["Ajouter un serveur", "Modifier une fiche serveur", "Supprimer un serveur", "Problème de validation", "Changement de propriétaire"]
  },
  {
    label: "Boutique / paiement",
    priority: 9,
    subcategories: ["Mises en avant premium", "Pubs", "Abonnements"]
  },
  {
    label: "Signalement / modération",
    priority: 8,
    subcategories: ["Signaler un serveur illégal", "Contenu interdit", "Fake serveur", "Abus d’un utilisateur"]
  },
  {
    label: "Partenariats / contact staff",
    priority: 5,
    subcategories: ["Partenariat", "Publicité", "Influenceur", "Recrutement staff", "Questions générales"]
  },
  {
    label: "Autre demande",
    priority: 3,
    subcategories: []
  }
];

const priorityLabels: Record<number, string> = {
  9: "Très critique",
  8: "Haute",
  7: "Importante",
  6: "Normale",
  5: "Normale",
  4: "Faible",
  3: "Faible",
  2: "Minimal",
  1: "Minimal"
};

export function AdminTicketsPage(): JSX.Element {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<string[]>([""]);
  const [replyUploading, setReplyUploading] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editAssignedAdmin, setEditAssignedAdmin] = useState<string>("");

  const adminUsers = useMemo(() => users.filter((entry) => entry.role === "admin"), [users]);
  const categoryConfig = useMemo(
    () => CATEGORY_CONFIG.find((entry) => entry.label === editCategory) ?? CATEGORY_CONFIG[0],
    [editCategory]
  );

  useEffect(() => {
    async function loadUsers(): Promise<void> {
      if (!token) return;
      try {
        const result = await apiRequest<UsersResponse>("/admin/users", { token });
        setUsers(result.users);
      } catch {
        setUsers([]);
      }
    }
    void loadUsers();
  }, [token]);

  useEffect(() => {
    async function loadTickets(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (adminFilter) params.set("adminUserId", adminFilter);
        if (userFilter) params.set("userId", userFilter);
        if (priorityFilter) params.set("priority", priorityFilter);
        if (search) params.set("search", search);
        if (fromDate) params.set("from", `${fromDate}T00:00:00`);
        if (toDate) params.set("to", `${toDate}T23:59:59`);
        const result = await apiRequest<TicketsResponse>(`/admin/tickets?${params.toString()}`, { token });
        setTickets(result.tickets);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger les tickets.");
      } finally {
        setLoading(false);
      }
    }
    void loadTickets();
  }, [token, statusFilter, adminFilter, userFilter, priorityFilter, search, fromDate, toDate]);

  useEffect(() => {
    if (categoryConfig.subcategories.length) {
      setEditSubcategory(categoryConfig.subcategories[0]);
    } else {
      setEditSubcategory("");
    }
  }, [categoryConfig]);

  async function loadTicket(ticketId: string): Promise<void> {
    if (!token) return;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await apiRequest<TicketDetailResponse>(`/admin/tickets/${ticketId}`, { token });
      setSelectedTicket(detail.ticket);
      setMessages(detail.messages);
      setEditStatus(detail.ticket.status);
      setEditCategory(detail.ticket.category);
      setEditSubcategory(detail.ticket.subcategory ?? "");
      setEditAssignedAdmin(detail.ticket.assigned_admin_id ?? "");
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Chargement du ticket impossible.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshTickets(): Promise<void> {
    if (!token) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (adminFilter) params.set("adminUserId", adminFilter);
    if (userFilter) params.set("userId", userFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (search) params.set("search", search);
    if (fromDate) params.set("from", `${fromDate}T00:00:00`);
    if (toDate) params.set("to", `${toDate}T23:59:59`);
    const result = await apiRequest<TicketsResponse>(`/admin/tickets?${params.toString()}`, { token });
    setTickets(result.tickets);
  }

  function updateAttachment(index: number, value: string, listSetter: (next: string[]) => void, list: string[]): void {
    const next = [...list];
    next[index] = value;
    listSetter(next);
  }

  function addAttachment(listSetter: (next: string[]) => void, list: string[]): void {
    listSetter([...list, ""]);
  }

  function removeAttachment(index: number, listSetter: (next: string[]) => void, list: string[]): void {
    if (list.length === 1) {
      listSetter([""]);
      return;
    }
    listSetter(list.filter((_, idx) => idx !== index));
  }

  async function uploadFiles(files: FileList | null): Promise<void> {
    if (!token || !files || files.length === 0) return;
    setReplyUploading(true);
    setDetailError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      const result = await apiRequest<{ files: string[] }>("/tickets/attachments", {
        method: "POST",
        token,
        body: formData
      });
      const cleaned = replyAttachments.filter((entry) => entry.trim().length > 0);
      setReplyAttachments([...cleaned, ...result.files, ""]);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Téléversement impossible.");
    } finally {
      setReplyUploading(false);
    }
  }

  async function onReply(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !selectedTicket) return;
    setDetailError(null);
    try {
      await apiRequest<{ message: TicketMessage }>(`/admin/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        token,
        body: {
          message: replyMessage,
          attachments: replyAttachments.map((item) => item.trim()).filter(Boolean)
        }
      });
      setReplyMessage("");
      setReplyAttachments([""]);
      await loadTicket(selectedTicket.id);
      await refreshTickets();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Envoi du message impossible.");
    }
  }

  async function onAssignToMe(): Promise<void> {
    if (!token || !selectedTicket) return;
    setDetailError(null);
    try {
      await apiRequest(`/admin/tickets/${selectedTicket.id}/assign`, { method: "POST", token });
      await loadTicket(selectedTicket.id);
      await refreshTickets();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Assignation impossible.");
    }
  }

  async function onSaveTicket(): Promise<void> {
    if (!token || !selectedTicket) return;
    setDetailError(null);
    try {
      await apiRequest(`/admin/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        token,
        body: {
          status: editStatus || undefined,
          category: editCategory || undefined,
          subcategory: editSubcategory || undefined,
          assignedAdminId: editAssignedAdmin ? editAssignedAdmin : null
        }
      });
      await loadTicket(selectedTicket.id);
      await refreshTickets();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
  }

  return (
    <div className="admin-page">
      <article className="card admin-page-head">
        <h2>Tickets</h2>
        <p>Supervision complète des demandes, statuts et réponses.</p>
      </article>

      <article className="card admin-filter-card">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche pseudo ou référence..." />
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          <option value="">Toutes priorités</option>
          {Object.keys(priorityLabels)
            .map((value) => Number(value))
            .sort((a, b) => b - a)
            .map((value) => (
              <option key={value} value={String(value)}>
                {value} - {priorityLabels[value]}
              </option>
            ))}
        </select>
        <select value={adminFilter} onChange={(event) => setAdminFilter(event.target.value)}>
          <option value="">Tous les admins</option>
          <option value="none">Non assigné</option>
          {adminUsers.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.pseudo}
            </option>
          ))}
        </select>
        <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
          <option value="">Tous les utilisateurs</option>
          {users
            .filter((entry) => entry.role === "user")
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.pseudo}
              </option>
            ))}
        </select>
      </article>

      <div className="tickets-admin-layout">
        <article className="card tickets-list-card">
          <h3>Tickets reçus</h3>
          {loading ? (
            <p>Chargement des tickets...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : tickets.length === 0 ? (
            <p>Aucun ticket trouvé.</p>
          ) : (
            <div className="tickets-list">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  className={`tickets-list-item ${selectedTicketId === ticket.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    void loadTicket(ticket.id);
                  }}
                >
                  <div>
                    <h3>{ticket.reference}</h3>
                    <p>{ticket.user_pseudo}</p>
                    <p>{ticket.category}</p>
                  </div>
                  <div className="tickets-list-meta">
                    <span className="status-pill status-pending">{ticket.status}</span>
                    <span className="tag">Priorité {ticket.priority}</span>
                    {ticket.assigned_admin_pseudo && <span className="tag">{ticket.assigned_admin_pseudo}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card tickets-detail-card">
          <h3>Gestion du ticket</h3>
          {!selectedTicketId ? (
            <p>Sélectionnez un ticket.</p>
          ) : detailLoading ? (
            <p>Chargement du ticket...</p>
          ) : detailError ? (
            <p className="error-text">{detailError}</p>
          ) : !selectedTicket ? (
            <p>Ticket introuvable.</p>
          ) : (
            <>
              <div className="tickets-detail-head">
                <div>
                  <h4>{selectedTicket.reference}</h4>
                  <p>{selectedTicket.category}{selectedTicket.subcategory ? ` · ${selectedTicket.subcategory}` : ""}</p>
                  {selectedTicket.server_name && <p>Serveur : {selectedTicket.server_name}</p>}
                  {selectedTicket.server_url && <p>URL : {selectedTicket.server_url}</p>}
                  <p>Ouvert le {new Date(selectedTicket.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <div className="tickets-detail-meta">
                  <span className="status-pill status-pending">{selectedTicket.status}</span>
                  <span className="tag">Priorité {selectedTicket.priority}</span>
                </div>
              </div>

              <div className="tickets-admin-actions">
                <button className="btn" type="button" onClick={() => void onAssignToMe()} disabled={selectedTicket.assigned_admin_id === user?.id}>
                  M’assigner le ticket
                </button>
                <label>
                  Statut
                  <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Admin assigné
                  <select value={editAssignedAdmin} onChange={(event) => setEditAssignedAdmin(event.target.value)}>
                    <option value="">Non assigné</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.pseudo}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Catégorie
                  <select value={editCategory} onChange={(event) => setEditCategory(event.target.value)}>
                    {CATEGORY_CONFIG.map((entry) => (
                      <option key={entry.label} value={entry.label}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sous-catégorie
                  <select value={editSubcategory} onChange={(event) => setEditSubcategory(event.target.value)} disabled={!categoryConfig.subcategories.length}>
                    {!categoryConfig.subcategories.length && <option value="">Aucune</option>}
                    {categoryConfig.subcategories.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn" type="button" onClick={() => void onSaveTicket()}>
                  Sauvegarder les modifications
                </button>
              </div>

              <div className="tickets-messages">
                {messages.map((entry) => (
                  <div key={entry.id} className={`tickets-message ${entry.author_role === "admin" ? "is-admin" : ""}`}>
                    <div className="tickets-message-head">
                      <strong>{entry.author_role === "admin" ? entry.admin_pseudo ?? "Admin" : entry.user_pseudo ?? "Utilisateur"}</strong>
                      <span>{new Date(entry.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                    <p>{entry.message}</p>
                    {entry.attachments.length > 0 && (
                      <div className="tickets-message-attachments">
                        {entry.attachments.map((file) => (
                          <a key={file} href={file} target="_blank" rel="noreferrer">
                            {file}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form className="form tickets-reply-form" onSubmit={onReply}>
                <label>
                  Répondre au ticket
                  <textarea rows={4} value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required />
                </label>
                <div className="tickets-attachments">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.mp3,.wav,.mp4,.gif,.xlsv,.csv"
                    onChange={(event) => {
                      void uploadFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                    disabled={replyUploading}
                  />
                  {replyUploading && <p>Envoi des fichiers en cours...</p>}
                  {replyAttachments.map((item, index) => (
                    <div key={`reply-attachment-${index}`} className="tickets-attachment-row">
                      <input
                        value={item}
                        onChange={(event) => updateAttachment(index, event.target.value, setReplyAttachments, replyAttachments)}
                        placeholder="https://exemple.com/preuve.png"
                      />
                      <button className="btn btn-ghost" type="button" onClick={() => removeAttachment(index, setReplyAttachments, replyAttachments)}>
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-ghost" type="button" onClick={() => addAttachment(setReplyAttachments, replyAttachments)}>
                    Ajouter une pièce jointe
                  </button>
                </div>
                {detailError && <p className="error-text">{detailError}</p>}
                <button className="btn" type="submit">
                  Envoyer la réponse
                </button>
              </form>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
