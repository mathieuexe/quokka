import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Server } from "../types";

type Ticket = {
  id: string;
  reference: string;
  status: string;
  priority: number;
  category: string;
  subcategory: string | null;
  server_name: string | null;
  assigned_admin_pseudo: string | null;
  created_at: string;
  last_message_at: string;
  server_url: string | null;
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

type TicketListResponse = {
  tickets: Ticket[];
};

type TicketDetailResponse = {
  ticket: Ticket;
  messages: TicketMessage[];
};

type TicketCreateResponse = {
  ticket: Ticket;
  messages: TicketMessage[];
  reference: string;
};

type DashboardResponse = {
  servers: Server[];
  subscriptions: Array<{
    id: string;
    server_id: string;
    server_name: string;
    type: "quokka_plus" | "essentiel";
  }>;
};

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
    subcategories: ["Signaler un serveur illégal", "Contenu interdit", "Fake serveur", "Abus d’un utilisateur"],
    requireServerUrl: true,
    requireAttachments: true
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

export function TicketsPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [subscriptions, setSubscriptions] = useState<DashboardResponse["subscriptions"]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORY_CONFIG[0].label);
  const [subcategory, setSubcategory] = useState(CATEGORY_CONFIG[0].subcategories[0] ?? "");
  const [serverId, setServerId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<string[]>([""]);
  const [replyUploading, setReplyUploading] = useState(false);

  const categoryConfig = useMemo(() => CATEGORY_CONFIG.find((item) => item.label === category) ?? CATEGORY_CONFIG[0], [category]);
  const priorityLabel = priorityLabels[categoryConfig.priority] ?? "Normale";

  useEffect(() => {
    async function loadData(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const [ticketData, dashboardData] = await Promise.all([
          apiRequest<TicketListResponse>("/tickets", { token }),
          apiRequest<DashboardResponse>("/dashboard", { token })
        ]);
        setTickets(ticketData.tickets);
        setServers(dashboardData.servers);
        setSubscriptions(dashboardData.subscriptions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger vos tickets.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [token]);

  useEffect(() => {
    if (categoryConfig.subcategories.length) {
      setSubcategory(categoryConfig.subcategories[0]);
    } else {
      setSubcategory("");
    }
  }, [categoryConfig]);

  async function loadTicket(ticketId: string): Promise<void> {
    if (!token) return;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await apiRequest<TicketDetailResponse>(`/tickets/${ticketId}`, { token });
      setSelectedTicket(detail.ticket);
      setMessages(detail.messages);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Chargement du ticket impossible.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshTickets(): Promise<void> {
    if (!token) return;
    const ticketData = await apiRequest<TicketListResponse>("/tickets", { token });
    setTickets(ticketData.tickets);
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

  async function uploadFiles(
    files: FileList | null,
    listSetter: (next: string[]) => void,
    list: string[],
    setBusy: (value: boolean) => void,
    setErrorMessage: (value: string | null) => void
  ): Promise<void> {
    if (!token || !files || files.length === 0) return;
    setBusy(true);
    setErrorMessage(null);
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
      const cleaned = list.filter((entry) => entry.trim().length > 0);
      listSetter([...cleaned, ...result.files, ""]);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Téléversement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateTicket(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const payload = {
        category,
        subcategory: subcategory || undefined,
        message,
        attachments: attachments.map((item) => item.trim()).filter(Boolean),
        serverId: serverId || undefined,
        subscriptionId: subscriptionId || undefined,
        serverUrl: serverUrl.trim() || undefined
      };
      const result = await apiRequest<TicketCreateResponse>("/tickets", {
        method: "POST",
        token,
        body: payload
      });
      showToast(`Ticket créé : ${result.reference}`);
      setCreateOpen(false);
      setMessage("");
      setAttachments([""]);
      setServerId("");
      setSubscriptionId("");
      setServerUrl("");
      await refreshTickets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création du ticket impossible.");
    }
  }

  async function onReply(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !selectedTicket) return;
    setDetailError(null);
    try {
      await apiRequest<{ message: TicketMessage }>(`/tickets/${selectedTicket.id}/messages`, {
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

  return (
    <section className="page tickets-page">
      <article className="card tickets-hero">
        <div>
          <h1>Besoin d’assistance</h1>
          <p>Créez un ticket pour joindre l’équipe Quokka et suivez vos échanges.</p>
        </div>
        <button className="btn" type="button" onClick={() => setCreateOpen((current) => !current)}>
          {createOpen ? "Fermer le formulaire" : "Créer un nouveau ticket"}
        </button>
      </article>

      {createOpen && (
        <article className="card tickets-form-card">
          <h2>Nouveau ticket</h2>
          <form className="form" onSubmit={onCreateTicket}>
            <div className="tickets-form-grid">
              <label>
                Catégorie
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORY_CONFIG.map((entry) => (
                    <option key={entry.label} value={entry.label}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Sous-catégorie
                <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} disabled={!categoryConfig.subcategories.length}>
                  {!categoryConfig.subcategories.length && <option value="">Aucune</option>}
                  {categoryConfig.subcategories.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priorité automatique
                <input value={`${categoryConfig.priority}/10 · ${priorityLabel}`} readOnly />
              </label>
              <label>
                Serveur concerné
                <select value={serverId} onChange={(event) => setServerId(event.target.value)}>
                  <option value="">Aucun</option>
                  {servers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Abonnement concerné (optionnel)
                <select value={subscriptionId} onChange={(event) => setSubscriptionId(event.target.value)}>
                  <option value="">Aucun</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.server_name} · {sub.type}
                    </option>
                  ))}
                </select>
              </label>
              {categoryConfig.requireServerUrl && (
                <label>
                  URL du serveur signalé
                  <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} required />
                </label>
              )}
            </div>
            <label>
              Message
              <textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} required />
            </label>
            <div className="tickets-attachments">
              <p>Pièces jointes (URL autorisées : pdf, png, jpg, jpeg, mp3, wav, mp4, gif, xlsv, csv)</p>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.mp3,.wav,.mp4,.gif,.xlsv,.csv"
                onChange={(event) => {
                  void uploadFiles(event.target.files, setAttachments, attachments, setUploading, setError);
                  event.currentTarget.value = "";
                }}
                disabled={uploading}
              />
              {uploading && <p>Envoi des fichiers en cours...</p>}
              {attachments.map((item, index) => (
                <div key={`attachment-${index}`} className="tickets-attachment-row">
                  <input
                    value={item}
                    onChange={(event) => updateAttachment(index, event.target.value, setAttachments, attachments)}
                    placeholder="https://exemple.com/preuve.png"
                    required={categoryConfig.requireAttachments && attachments.filter((entry) => entry.trim().length > 0).length === 0 && index === 0}
                  />
                  <button className="btn btn-ghost" type="button" onClick={() => removeAttachment(index, setAttachments, attachments)}>
                    Retirer
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost" type="button" onClick={() => addAttachment(setAttachments, attachments)}>
                Ajouter une pièce jointe
              </button>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn" type="submit">
              Envoyer le ticket
            </button>
          </form>
        </article>
      )}

      <div className="tickets-layout">
        <article className="card tickets-list-card">
          <h2>Historique des tickets</h2>
          {loading ? (
            <p>Chargement des tickets...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : tickets.length === 0 ? (
            <p>Aucun ticket créé.</p>
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
                    <p>{ticket.category}</p>
                    {ticket.subcategory && <p>{ticket.subcategory}</p>}
                  </div>
                  <div className="tickets-list-meta">
                    <span className="status-pill status-pending">{ticket.status}</span>
                    <span className="tag">Priorité {ticket.priority}</span>
                    <span className="tag">{new Date(ticket.last_message_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card tickets-detail-card">
          <h2>Conversation</h2>
          {!selectedTicketId ? (
            <p>Sélectionnez un ticket pour afficher le détail.</p>
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
                  <h3>{selectedTicket.reference}</h3>
                  <p>{selectedTicket.category}{selectedTicket.subcategory ? ` · ${selectedTicket.subcategory}` : ""}</p>
                  {selectedTicket.server_name && <p>Serveur : {selectedTicket.server_name}</p>}
                  {selectedTicket.server_url && <p>URL : {selectedTicket.server_url}</p>}
                </div>
                <div className="tickets-detail-meta">
                  <span className="status-pill status-pending">{selectedTicket.status}</span>
                  <span className="tag">Priorité {selectedTicket.priority}</span>
                  {selectedTicket.assigned_admin_pseudo && <span className="tag">Assigné à {selectedTicket.assigned_admin_pseudo}</span>}
                </div>
              </div>
              <div className="tickets-messages">
                {messages.map((entry) => (
                  <div key={entry.id} className={`tickets-message ${entry.author_role === "admin" ? "is-admin" : ""}`}>
                    <div className="tickets-message-head">
                      <strong>{entry.author_role === "admin" ? entry.admin_pseudo ?? "Admin" : entry.user_pseudo ?? "Vous"}</strong>
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
                  Répondre
                  <textarea rows={4} value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required />
                </label>
                <div className="tickets-attachments">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.mp3,.wav,.mp4,.gif,.xlsv,.csv"
                    onChange={(event) => {
                      void uploadFiles(event.target.files, setReplyAttachments, replyAttachments, setReplyUploading, setDetailError);
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
    </section>
  );
}
