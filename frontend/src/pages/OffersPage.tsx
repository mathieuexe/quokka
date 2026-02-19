import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { useTranslation } from "react-i18next";
import type { Server, User } from "../types";

type DashboardResponse = {
  user: User;
  servers: Server[];
  subscriptions: Array<{
    id: string;
    server_id: string;
    server_name: string;
    type: "quokka_plus" | "essentiel";
    start_date: string;
    end_date: string;
    premium_slot?: string | null;
  }>;
};

type OfferType = "essentiel" | "quokka_plus";

type PromoPreviewResponse = {
  code: string;
  discount_type: "fixed" | "percent" | "free";
  discount_value: number;
  base_amount_cents: number;
  final_amount_cents: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function priceCentsFor(type: OfferType, days: number, hours: number): number {
  return type === "essentiel" ? clamp(days, 1, 30) * 500 : clamp(hours, 1, 24) * 100;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function OffersPage(): JSX.Element {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);

  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [offerType, setOfferType] = useState<OfferType>("essentiel");
  const [days, setDays] = useState<number>(7);
  const [hours, setHours] = useState<number>(6);
  const [startDate, setStartDate] = useState<string>(() => toDateInputValue(new Date()));
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<PromoPreviewResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setSuccessMessage(t("offers.paymentSuccess"));
      setCheckoutError(null);
      return;
    }
    if (payment === "cancel") {
      setCheckoutError(t("offers.paymentCancel"));
      setSuccessMessage(null);
    }
  }, [location.search, t]);

  useEffect(() => {
    async function loadServers(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<DashboardResponse>("/dashboard", { token });
        setServers(data.servers);
        setSelectedServerId((current) => current || data.servers[0]?.id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : t("offers.loadServersError"));
      } finally {
        setLoading(false);
      }
    }
    void loadServers();
  }, [token, t]);

  const selectedServer = useMemo(() => servers.find((s) => s.id === selectedServerId) ?? null, [servers, selectedServerId]);
  const baseAmountCents = useMemo(() => priceCentsFor(offerType, days, hours), [offerType, days, hours]);
  const totalAmountCents = useMemo(() => appliedPromo?.final_amount_cents ?? baseAmountCents, [appliedPromo, baseAmountCents]);
  const baseAmountLabel = useMemo(() => `${(baseAmountCents / 100).toFixed(2)} EUR`, [baseAmountCents]);
  const totalAmountLabel = useMemo(() => `${(totalAmountCents / 100).toFixed(2)} EUR`, [totalAmountCents]);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoError(null);
  }, [selectedServerId, offerType, days, hours, startDate]);

  function formatPromoLabel(promo: PromoPreviewResponse): string {
    if (promo.discount_type === "free") return t("offers.promoFree");
    if (promo.discount_type === "percent") return t("offers.promoPercent", { value: promo.discount_value });
    return t("offers.promoFixed", { value: (promo.discount_value / 100).toFixed(2) });
  }

  async function applyPromoCode(): Promise<void> {
    if (!token) return;
    const promoCode = promoCodeInput.trim();
    if (!promoCode) {
      setPromoError(t("offers.promoEnterCode"));
      return;
    }
    if (!selectedServerId) {
      setPromoError(t("offers.promoSelectServer"));
      return;
    }
    setPromoApplying(true);
    setPromoError(null);
    try {
      const payload =
        offerType === "essentiel"
          ? {
              serverId: selectedServerId,
              type: offerType,
              days: clamp(days, 1, 30),
              startDate: new Date(`${startDate}T00:00:00`).toISOString(),
              promoCode
            }
          : {
              serverId: selectedServerId,
              type: offerType,
              hours: clamp(hours, 1, 24),
              promoCode
            };

      const preview = await apiRequest<PromoPreviewResponse>("/payments/promo/preview", {
        method: "POST",
        token,
        body: payload
      });
      setAppliedPromo(preview);
    } catch (e) {
      setAppliedPromo(null);
      setPromoError(e instanceof Error ? e.message : t("offers.promoInvalid"));
    } finally {
      setPromoApplying(false);
    }
  }

  async function startCheckout(): Promise<void> {
    if (!token) return;
    if (!selectedServerId) {
      setCheckoutError(t("offers.checkoutSelectServer"));
      return;
    }
    setCheckoutError(null);
    setSuccessMessage(null);
    try {
      const promoCode = appliedPromo?.code ?? (promoCodeInput.trim() || undefined);
      const payload =
        offerType === "essentiel"
          ? {
              serverId: selectedServerId,
              type: offerType,
              days: clamp(days, 1, 30),
              startDate: new Date(`${startDate}T00:00:00`).toISOString(),
              returnTo: "offers" as const,
              promoCode
            }
          : {
              serverId: selectedServerId,
              type: offerType,
              hours: clamp(hours, 1, 24),
              returnTo: "offers" as const,
              promoCode
            };

      const response = await apiRequest<{ checkoutUrl: string }>("/payments/checkout-session", {
        method: "POST",
        token,
        body: payload
      });
      if (response.checkoutUrl) {
        try {
          const url = new URL(response.checkoutUrl);
          const isSameProtocol = url.protocol === window.location.protocol;
          const isSameHost = url.host === window.location.host;
          const isSamePort = url.port === window.location.port;
          const isLocalHost =
            url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0";
          if (isSameProtocol && (isSameHost || (isSamePort && isLocalHost))) {
            navigate(`${url.pathname}${url.search}${url.hash}`, { replace: true });
            return;
          }
        } catch {
          // ignore
        }
        window.location.href = response.checkoutUrl;
      } else {
        setCheckoutError(t("offers.checkoutStartError"));
      }
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : t("offers.checkoutCreateError"));
    }
  }

  return (
    <section className="page offers-page">
      <div className="card offers-hero">
        <h1>{t("offers.title")}</h1>
        <p className="offers-subtitle">{t("offers.subtitle")}</p>
      </div>

      {loading && <p>{t("common.loading")}</p>}
      {error && <p className="error-text">{error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}
      {checkoutError && <p className="error-text">{checkoutError}</p>}

      {!loading && !error && servers.length === 0 && (
        <article className="card">
          <h2>{t("offers.noServerTitle")}</h2>
          <p>{t("offers.noServerText")}</p>
          <Link className="btn" to="/add-server">
            {t("offers.addServerButton")}
          </Link>
        </article>
      )}

      {!loading && !error && servers.length > 0 && (
        <div className="offers-layout">
          <article className="card offers-card">
            <h2>{t("offers.step1Title")}</h2>
            <div className="offers-server-grid" role="list">
              {servers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  className={`offers-server-tile ${server.id === selectedServerId ? "is-selected" : ""}`}
                  onClick={() => setSelectedServerId(server.id)}
                  role="listitem"
                >
                  <strong className="offers-server-name">{server.name}</strong>
                  <span className="offers-server-meta">
                    Ref #{server.reference_number} · {server.category_label}
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className="card offers-card">
            <h2>{t("offers.step2Title")}</h2>
            <div className="offers-plan-grid">
              <button
                type="button"
                className={`offers-plan ${offerType === "essentiel" ? "is-selected" : ""}`}
                onClick={() => setOfferType("essentiel")}
              >
                <div className="offers-plan-head">
                  <strong>{t("offers.planEssentialName")}</strong>
                  <span>{t("offers.planEssentialPrice")}</span>
                </div>
                <p>{t("offers.planEssentialDesc")}</p>
              </button>
              <button
                type="button"
                className={`offers-plan ${offerType === "quokka_plus" ? "is-selected" : ""}`}
                onClick={() => setOfferType("quokka_plus")}
              >
                <div className="offers-plan-head">
                  <strong>{t("offers.planPlusName")}</strong>
                  <span>{t("offers.planPlusPrice")}</span>
                </div>
                <p>{t("offers.planPlusDesc")}</p>
              </button>
            </div>

            {offerType === "essentiel" ? (
              <div className="offers-params">
                <label>
                  {t("offers.durationDays")}
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  />
                </label>
                <label>
                  {t("offers.startDate")}
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </label>
              </div>
            ) : (
              <div className="offers-params">
                <label>
                  {t("offers.durationHours")}
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={hours}
                    onChange={(event) => setHours(Number(event.target.value))}
                  />
                </label>
              </div>
            )}
          </article>

          <aside className="card offers-summary">
            <h2>{t("offers.step3Title")}</h2>
            <div className="offers-summary-row">
              <span>{t("offers.summaryServer")}</span>
              <strong>{selectedServer ? selectedServer.name : t("common.notAvailable", { defaultValue: "—" })}</strong>
            </div>
            <div className="offers-summary-row">
              <span>{t("offers.summaryOffer")}</span>
              <strong>{offerType === "essentiel" ? t("offers.planEssentialName") : t("offers.planPlusName")}</strong>
            </div>
            {offerType === "essentiel" ? (
              <>
                <div className="offers-summary-row">
                  <span>{t("offers.summaryDuration")}</span>
                  <strong>{t("offers.summaryDays", { count: clamp(days, 1, 30) })}</strong>
                </div>
                <div className="offers-summary-row">
                  <span>{t("offers.summaryStart")}</span>
                  <strong>{startDate || t("common.notAvailable", { defaultValue: "—" })}</strong>
                </div>
              </>
            ) : (
              <div className="offers-summary-row">
                <span>{t("offers.summaryDuration")}</span>
                <strong>{t("offers.summaryHours", { count: clamp(hours, 1, 24) })}</strong>
              </div>
            )}
            <div className="offers-summary-row">
              <span>{t("offers.summaryPromo")}</span>
              <strong>{appliedPromo ? appliedPromo.code : t("common.notAvailable", { defaultValue: "—" })}</strong>
            </div>
            <div className="offers-promo-row">
              <input
                value={promoCodeInput}
                onChange={(event) => setPromoCodeInput(event.target.value.toUpperCase())}
                placeholder={t("offers.promoPlaceholder")}
              />
              <button className="btn btn-ghost" type="button" onClick={() => void applyPromoCode()} disabled={promoApplying}>
                {promoApplying ? t("common.loading") : t("offers.promoApply")}
              </button>
              {appliedPromo && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoError(null);
                  }}
                >
                  {t("offers.promoRemove")}
                </button>
              )}
            </div>
            {promoError && <p className="error-text">{promoError}</p>}
            {appliedPromo && (
              <div className="offers-summary-row">
                <span>{t("offers.summaryDiscount")}</span>
                <strong>{formatPromoLabel(appliedPromo)}</strong>
              </div>
            )}
            <div className="offers-summary-total">
              <span>{t("offers.summaryTotal")}</span>
              <strong>{totalAmountLabel}</strong>
            </div>
            {appliedPromo && appliedPromo.final_amount_cents !== appliedPromo.base_amount_cents && (
              <p className="offers-summary-note">{t("offers.summarySubtotal", { amount: baseAmountLabel })}</p>
            )}
            <button className="btn offers-pay-btn" type="button" onClick={() => void startCheckout()} disabled={!selectedServerId}>
              {t("offers.payButton")}
            </button>
            <Link className="btn btn-ghost" to="/subscriptions">
              {t("offers.viewOrders")}
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
