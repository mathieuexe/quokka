import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

type AdminSubscription = {
  id: string;
  server_id: string;
  server_name: string;
  owner_pseudo: string;
  type: "quokka_plus" | "essentiel";
  start_date: string;
  end_date: string;
  premium_slot: number | null;
  lifecycle_status: "active" | "terminated";
};

type AdminPayment = {
  id: string;
  checkout_session_id: string;
  status: "pending" | "completed" | "failed";
  subscription_type: "quokka_plus" | "essentiel";
  amount_cents: number;
  duration_days: number | null;
  duration_hours: number | null;
  user_id: string;
  user_pseudo: string;
  user_email: string;
  server_id: string;
  server_name: string;
  planned_start_date: string | null;
  promotion_start_date: string | null;
  promotion_end_date: string | null;
  created_at: string;
};

type BillingResponse = {
  subscriptions: AdminSubscription[];
  payments: AdminPayment[];
};

type BillingFilter = "all" | "active" | "pending" | "terminated" | "cancelled";

function getPaymentStatusLabel(status: AdminPayment["status"]): string {
  if (status === "pending") return "En attente de paiement";
  if (status === "completed") return "Terminé (payé)";
  return "Résilié / Échoué";
}

export function AdminSubscriptionsPage(): JSX.Element {
  const { token } = useAuth();
  const [billing, setBilling] = useState<BillingResponse>({ subscriptions: [], payments: [] });
  const [filter, setFilter] = useState<BillingFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBilling(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<BillingResponse>("/admin/billing", { token });
        setBilling(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chargement des abonnements impossible.");
      } finally {
        setLoading(false);
      }
    }
    void loadBilling();
  }, [token]);

  const counters = useMemo(() => {
    const active = billing.subscriptions.filter((entry) => entry.lifecycle_status === "active").length;
    const terminated = billing.subscriptions.filter((entry) => entry.lifecycle_status === "terminated").length;
    const pending = billing.payments.filter((entry) => entry.status === "pending").length;
    const cancelled = billing.payments.filter((entry) => entry.status === "failed").length;
    return { active, terminated, pending, cancelled };
  }, [billing]);

  const visibleSubscriptions = useMemo(() => {
    const value = search.trim().toLowerCase();
    return billing.subscriptions.filter((entry) => {
      const statusOk =
        filter === "active"
          ? entry.lifecycle_status === "active"
          : filter === "terminated"
            ? entry.lifecycle_status === "terminated"
            : true;
      const searchOk =
        entry.server_name.toLowerCase().includes(value) ||
        entry.owner_pseudo.toLowerCase().includes(value) ||
        entry.type.toLowerCase().includes(value);
      const startDate = new Date(entry.start_date).getTime();
      const fromOk = dateFrom ? startDate >= new Date(`${dateFrom}T00:00:00`).getTime() : true;
      const toOk = dateTo ? startDate <= new Date(`${dateTo}T23:59:59`).getTime() : true;
      return statusOk && searchOk && fromOk && toOk;
    });
  }, [billing.subscriptions, filter, search, dateFrom, dateTo]);

  const visiblePayments = useMemo(() => {
    const value = search.trim().toLowerCase();
    return billing.payments.filter((entry) => {
      const statusOk =
        filter === "pending"
          ? entry.status === "pending"
          : filter === "cancelled"
            ? entry.status === "failed"
            : filter === "terminated"
              ? entry.status === "completed"
              : true;
      const searchOk =
        entry.server_name.toLowerCase().includes(value) ||
        entry.user_pseudo.toLowerCase().includes(value) ||
        entry.user_email.toLowerCase().includes(value);
      const createdAt = new Date(entry.created_at).getTime();
      const fromOk = dateFrom ? createdAt >= new Date(`${dateFrom}T00:00:00`).getTime() : true;
      const toOk = dateTo ? createdAt <= new Date(`${dateTo}T23:59:59`).getTime() : true;
      return statusOk && searchOk && fromOk && toOk;
    });
  }, [billing.payments, filter, search, dateFrom, dateTo]);

  const subscriptionTotalPages = Math.max(1, Math.ceil(visibleSubscriptions.length / pageSize));
  const paymentTotalPages = Math.max(1, Math.ceil(visiblePayments.length / pageSize));
  const paginatedSubscriptions = useMemo(() => {
    const safePage = Math.min(subscriptionPage, subscriptionTotalPages);
    const start = (safePage - 1) * pageSize;
    return visibleSubscriptions.slice(start, start + pageSize);
  }, [visibleSubscriptions, subscriptionPage, subscriptionTotalPages, pageSize]);
  const paginatedPayments = useMemo(() => {
    const safePage = Math.min(paymentPage, paymentTotalPages);
    const start = (safePage - 1) * pageSize;
    return visiblePayments.slice(start, start + pageSize);
  }, [visiblePayments, paymentPage, paymentTotalPages, pageSize]);

  useEffect(() => {
    setSubscriptionPage(1);
    setPaymentPage(1);
  }, [filter, search, dateFrom, dateTo, pageSize]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Abonnements et paiements</h2>
        <p>Liste dédiée des états : actif, en attente, terminé et résilié.</p>
      </div>

      <article className="card admin-filter-card">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher serveur, propriétaire, email..." />
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <button className={`btn ${filter === "all" ? "" : "btn-ghost"}`} type="button" onClick={() => setFilter("all")}>
          Tout
        </button>
        <button className={`btn ${filter === "active" ? "" : "btn-ghost"}`} type="button" onClick={() => setFilter("active")}>
          Actifs ({counters.active})
        </button>
        <button className={`btn ${filter === "pending" ? "" : "btn-ghost"}`} type="button" onClick={() => setFilter("pending")}>
          En attente ({counters.pending})
        </button>
        <button
          className={`btn ${filter === "terminated" ? "" : "btn-ghost"}`}
          type="button"
          onClick={() => setFilter("terminated")}
        >
          Terminés ({counters.terminated})
        </button>
        <button
          className={`btn ${filter === "cancelled" ? "" : "btn-ghost"}`}
          type="button"
          onClick={() => setFilter("cancelled")}
        >
          Résiliés ({counters.cancelled})
        </button>
      </article>

      {loading ? (
        <p>Chargement des abonnements...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <>
          <article className="card">
            <h3>Abonnements serveur</h3>
            <div className="admin-table-wrap">
              {paginatedSubscriptions.map((entry) => (
                <div key={entry.id} className="admin-list-item static">
                  <div>
                    <h3>{entry.server_name}</h3>
                    <p>Propriétaire : {entry.owner_pseudo}</p>
                    <p>
                      Du {new Date(entry.start_date).toLocaleString("fr-FR")} au{" "}
                      {new Date(entry.end_date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="admin-list-item-meta">
                    <span className={`status-pill ${entry.lifecycle_status === "active" ? "status-paid" : "status-pending"}`}>
                      {entry.lifecycle_status === "active" ? "Actif" : "Terminé"}
                    </span>
                    <span className="tag">{entry.type}</span>
                  </div>
                </div>
              ))}
              {visibleSubscriptions.length === 0 && <p>Aucun abonnement dans ce filtre.</p>}
              <div className="admin-pagination">
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={subscriptionPage <= 1}
                  onClick={() => setSubscriptionPage((current) => current - 1)}
                >
                  Précédent
                </button>
                <span>
                  Page {Math.min(subscriptionPage, subscriptionTotalPages)} / {subscriptionTotalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={subscriptionPage >= subscriptionTotalPages}
                  onClick={() => setSubscriptionPage((current) => current + 1)}
                >
                  Suivant
                </button>
              </div>
            </div>
          </article>

          <article className="card">
            <h3>Historique paiements</h3>
            <div className="admin-table-wrap">
              {paginatedPayments.map((payment) => (
                <div key={payment.id} className="admin-list-item static">
                  <div>
                    <h3>{payment.server_name}</h3>
                    <p>
                      {payment.user_pseudo} ({payment.user_email})
                    </p>
                    <p>Montant : {(payment.amount_cents / 100).toFixed(2)} EUR</p>
                  </div>
                  <div className="admin-list-item-meta">
                    <span
                      className={`status-pill ${
                        payment.status === "completed"
                          ? "status-paid"
                          : payment.status === "pending"
                            ? "status-pending"
                            : "status-failed"
                      }`}
                    >
                      {getPaymentStatusLabel(payment.status)}
                    </span>
                    <span className="tag">{payment.subscription_type}</span>
                    <span className="tag">{new Date(payment.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                </div>
              ))}
              {visiblePayments.length === 0 && <p>Aucun paiement dans ce filtre.</p>}
              <div className="admin-pagination">
                <button className="btn btn-ghost" type="button" disabled={paymentPage <= 1} onClick={() => setPaymentPage((current) => current - 1)}>
                  Précédent
                </button>
                <span>
                  Page {Math.min(paymentPage, paymentTotalPages)} / {paymentTotalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={paymentPage >= paymentTotalPages}
                  onClick={() => setPaymentPage((current) => current + 1)}
                >
                  Suivant
                </button>
              </div>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
