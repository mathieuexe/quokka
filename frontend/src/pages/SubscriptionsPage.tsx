import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { useTranslation } from "react-i18next";
import type { User } from "../types";

type SubscriptionOrder = {
  id: string;
  order_reference?: string;
  checkout_session_id: string;
  status: "pending" | "completed" | "failed";
  subscription_type: "quokka_plus" | "essentiel";
  amount_cents: number;
  duration_days?: number | null;
  duration_hours?: number | null;
  server_id: string;
  server_name: string;
  created_at: string;
  planned_start_date: string | null;
  promotion_start_date: string | null;
  promotion_end_date: string | null;
  effective_start_date: string | null;
  effective_end_date: string | null;
  is_offered_by_quokka?: boolean;
};

type DashboardResponse = {
  user: User;
};

function getStatusLabel(status: SubscriptionOrder["status"], isOfferedByQuokka?: boolean): string {
  if (isOfferedByQuokka) return "GIFTED";
  if (status === "completed") return "COMPLETED";
  if (status === "pending") return "PENDING";
  return "FAILED";
}

function getStatusClass(status: SubscriptionOrder["status"], isOfferedByQuokka?: boolean): string {
  if (isOfferedByQuokka) return "status-info";
  if (status === "completed") return "status-paid";
  if (status === "pending") return "status-pending";
  return "status-failed";
}

export function SubscriptionsPage(): JSX.Element {
  const { token, isAuthenticated, user, updateUser } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed" | "gifted">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceCents, setBalanceCents] = useState(user?.balance_cents ?? 0);
  const [balanceUpdatedAt, setBalanceUpdatedAt] = useState<string | null>(user?.last_balance_update ?? null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMessage, setTopupMessage] = useState<string | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<{ orders: SubscriptionOrder[] }>("/payments/orders", { token });
        setOrders(data.orders);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("subscriptions.loadError"));
      } finally {
        setLoading(false);
      }
    }
    void loadOrders();
  }, [token, t]);

  useEffect(() => {
    setBalanceCents(user?.balance_cents ?? 0);
    setBalanceUpdatedAt(user?.last_balance_update ?? null);
  }, [user]);

  useEffect(() => {
    async function loadBalance(): Promise<void> {
      if (!token) return;
      setBalanceLoading(true);
      setBalanceError(null);
      try {
        const data = await apiRequest<DashboardResponse>("/dashboard", { token });
        setBalanceCents(data.user.balance_cents ?? 0);
        setBalanceUpdatedAt(data.user.last_balance_update ?? null);
        updateUser({ ...data.user });
      } catch (e) {
        setBalanceError(e instanceof Error ? e.message : t("subscriptions.balanceLoadError"));
      } finally {
        setBalanceLoading(false);
      }
    }
    void loadBalance();
  }, [token, t, updateUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("topup");
    if (status === "success") {
      setTopupMessage(t("subscriptions.balanceTopupSuccess"));
      setTopupError(null);
      return;
    }
    if (status === "cancel") {
      setTopupMessage(null);
      setTopupError(t("subscriptions.balanceTopupCancel"));
    }
  }, [location.search, t]);

  async function startTopup(): Promise<void> {
    if (!token) return;
    const normalized = topupAmount.replace(",", ".");
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTopupError(t("subscriptions.balanceTopupInvalid"));
      return;
    }
    setTopupLoading(true);
    setTopupError(null);
    try {
      const response = await apiRequest<{ checkoutUrl: string }>("/payments/balance-topup", {
        method: "POST",
        token,
        body: { amountEuros: amount }
      });
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        setTopupError(t("subscriptions.balanceTopupError"));
      }
    } catch (e) {
      setTopupError(e instanceof Error ? e.message : t("subscriptions.balanceTopupError"));
    } finally {
      setTopupLoading(false);
    }
  }

  async function downloadInvoice(orderId: string): Promise<void> {
    if (!token) return;
    try {
      const envApiUrl = import.meta.env.VITE_API_URL;
      const rawApiUrl =
        envApiUrl && envApiUrl.trim()
          ? envApiUrl
          : typeof window !== "undefined"
            ? `${window.location.origin}/api`
            : "https://quokka.gg/api";
      const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
      const apiUrl = /\/api(\/|$)/.test(normalizedApiUrl) ? normalizedApiUrl : `${normalizedApiUrl}/api`;
      const response = await fetch(`${apiUrl}/payments/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? t("subscriptions.invoiceDownloadError"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("subscriptions.invoiceDownloadError"));
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="page">
        <h1>{t("nav.subscriptions")}</h1>
        <p>{t("subscriptions.loginRequired")}</p>
      </section>
    );
  }

  const filteredOrders = useMemo(() => {
    const value = search.trim().toLowerCase();
    return orders.filter((order) => {
      const statusOk =
        statusFilter === "all"
          ? true
          : statusFilter === "gifted"
            ? order.is_offered_by_quokka === true
            : order.status === statusFilter;
      const searchOk =
        order.server_name.toLowerCase().includes(value) ||
        order.id.toLowerCase().includes(value) ||
        order.subscription_type.toLowerCase().includes(value);
      return statusOk && searchOk;
    });
  }, [orders, statusFilter, search]);

  const stats = useMemo(() => {
    const completed = orders.filter((order) => order.status === "completed").length;
    const pending = orders.filter((order) => order.status === "pending").length;
    const failed = orders.filter((order) => order.status === "failed").length;
    const gifted = orders.filter((order) => order.is_offered_by_quokka).length;
    const totalAmount = orders.reduce((sum, order) => sum + order.amount_cents, 0);
    return { completed, pending, failed, gifted, totalAmount };
  }, [orders]);

  const locale = i18n.language || "fr";
  const resolveStatusLabel = (status: SubscriptionOrder["status"], isOfferedByQuokka?: boolean): string => {
    const key = getStatusLabel(status, isOfferedByQuokka);
    if (key === "GIFTED") return t("subscriptions.statusGifted");
    if (key === "COMPLETED") return t("subscriptions.statusPaid");
    if (key === "PENDING") return t("subscriptions.statusPending");
    return t("subscriptions.statusFailed");
  };

  return (
    <section className="page subscriptions-page">
      <div className="subscriptions-hero card">
        <h1>{t("subscriptions.title")}</h1>
        <p className="subscriptions-subtitle">{t("subscriptions.subtitle")}</p>
      </div>

      <article className="card subscriptions-balance">
        <div className="subscriptions-balance-main">
          <div>
            <h2>{t("subscriptions.balanceTitle")}</h2>
            <p className="subscriptions-subtitle">{t("subscriptions.balanceSubtitle")}</p>
          </div>
          <div className="subscriptions-balance-amount">
            <span>{t("subscriptions.balanceLabel")}</span>
            <strong>{(balanceCents / 100).toFixed(2)} EUR</strong>
            <span className="dashboard-muted">
              {t("subscriptions.balanceUpdated", {
                date: balanceUpdatedAt ? new Date(balanceUpdatedAt).toLocaleString(i18n.language || "fr") : "—"
              })}
            </span>
          </div>
        </div>
        <div className="subscriptions-balance-actions">
          <label>
            {t("subscriptions.balanceTopupLabel")}
            <input
              type="number"
              min={0}
              step="0.01"
              value={topupAmount}
              onChange={(event) => setTopupAmount(event.target.value)}
              placeholder={t("subscriptions.balanceTopupPlaceholder")}
            />
          </label>
          <button className="btn" type="button" onClick={() => void startTopup()} disabled={topupLoading || balanceLoading}>
            {topupLoading ? t("common.loading") : t("subscriptions.balanceTopupButton")}
          </button>
        </div>
        {balanceError && <p className="error-text">{balanceError}</p>}
        {topupMessage && <p className="success-text">{topupMessage}</p>}
        {topupError && <p className="error-text">{topupError}</p>}
      </article>

      <article className="card subscriptions-kpi-grid">
        <div className="subscriptions-kpi">
          <span>{t("subscriptions.kpiTotalOrders")}</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="subscriptions-kpi">
          <span>{t("subscriptions.kpiPaid")}</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="subscriptions-kpi">
          <span>{t("subscriptions.kpiPending")}</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="subscriptions-kpi">
          <span>{t("subscriptions.kpiGifted")}</span>
          <strong>{stats.gifted}</strong>
        </div>
        <div className="subscriptions-kpi">
          <span>{t("subscriptions.kpiTotalAmount")}</span>
          <strong>{(stats.totalAmount / 100).toFixed(2)} EUR</strong>
        </div>
      </article>

      <article className="card subscriptions-toolbar">
        <label>
          {t("common.search")}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("subscriptions.searchPlaceholder")}
          />
        </label>
        <div className="subscriptions-filter-pills">
          <button
            type="button"
            className={`btn ${statusFilter === "all" ? "" : "btn-ghost"}`}
            onClick={() => setStatusFilter("all")}
          >
            {t("subscriptions.filterAll")}
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === "completed" ? "" : "btn-ghost"}`}
            onClick={() => setStatusFilter("completed")}
          >
            {t("subscriptions.filterPaid")}
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === "pending" ? "" : "btn-ghost"}`}
            onClick={() => setStatusFilter("pending")}
          >
            {t("subscriptions.filterPending")}
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === "failed" ? "" : "btn-ghost"}`}
            onClick={() => setStatusFilter("failed")}
          >
            {t("subscriptions.filterFailed")}
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === "gifted" ? "" : "btn-ghost"}`}
            onClick={() => setStatusFilter("gifted")}
          >
            {t("subscriptions.filterGifted")}
          </button>
        </div>
      </article>

      <p className="subscriptions-subtitle">
        {t("subscriptions.countShown", { count: filteredOrders.length })}
      </p>
      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>{t("subscriptions.loading")}</p>
      ) : !filteredOrders.length ? (
        <p>{t("subscriptions.empty")}</p>
      ) : (
        <div className="subscriptions-grid">
          {filteredOrders.map((order) => {
            const typeLabel = order.subscription_type === "essentiel" ? t("subscriptions.typeEssential") : t("subscriptions.typePlus");
            const quantityLabel =
              order.subscription_type === "essentiel"
                ? t("subscriptions.quantityDays", { count: order.duration_days ?? 1 })
                : t("subscriptions.quantityHours", { count: order.duration_hours ?? 1 });

            return (
              <article key={order.id} className="card subscription-card">
                <div className="subscription-card-head">
                  <h3>{t("subscriptions.orderTitle", { ref: order.order_reference ?? order.id.slice(0, 8).toUpperCase() })}</h3>
                  <span className={`status-pill ${getStatusClass(order.status, order.is_offered_by_quokka)}`}>
                    {resolveStatusLabel(order.status, order.is_offered_by_quokka)}
                  </span>
                </div>
                <p className="subscription-created-at">
                  {t("subscriptions.createdAt", { date: new Date(order.created_at).toLocaleString(locale) })}
                </p>

                <div className="subscription-meta-grid">
                  <p>
                    <strong>{t("subscriptions.metaServer")}</strong>
                    <span>{order.server_name}</span>
                  </p>
                  <p>
                    <strong>{t("subscriptions.metaSubscription")}</strong>
                    <span>{typeLabel}</span>
                  </p>
                  <p>
                    <strong>{t("subscriptions.metaStart")}</strong>
                    <span>
                      {order.effective_start_date ? new Date(order.effective_start_date).toLocaleString(locale) : t("subscriptions.metaPending")}
                    </span>
                  </p>
                  <p>
                    <strong>{t("subscriptions.metaEnd")}</strong>
                    <span>
                      {order.effective_end_date ? new Date(order.effective_end_date).toLocaleString(locale) : t("subscriptions.metaPending")}
                    </span>
                  </p>
                </div>

                <div className="subscription-total-row">
                  <span>{t("subscriptions.totalAmount")}</span>
                  <strong>{order.is_offered_by_quokka ? "0.00 EUR" : `${(order.amount_cents / 100).toFixed(2)} EUR`}</strong>
                </div>
                <p className="subscription-quantity">
                  <strong>{t("subscriptions.quantity")}:</strong> {quantityLabel}
                </p>

                <div className="server-card-actions">
                  <button className="btn" type="button" onClick={() => void downloadInvoice(order.id)}>
                    {t("subscriptions.downloadInvoice")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
