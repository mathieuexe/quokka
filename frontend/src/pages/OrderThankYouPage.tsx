import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ConfettiCanvas } from "../components/ConfettiCanvas";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { useTranslation } from "react-i18next";

type CheckoutSessionSummary = {
  order_reference: string;
  checkout_session_id: string;
  status: "pending" | "completed" | "failed";
  subscription_type: "quokka_plus" | "essentiel";
  amount_cents: number;
  server_id: string;
  server_name: string;
  created_at: string;
  promo: {
    base_amount_cents: number;
    promo_code: string | null;
    promo_discount_type: "fixed" | "percent" | "free" | null;
    promo_discount_value: number | null;
  } | null;
};

export function OrderThankYouPage(): JSX.Element {
  const { token, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CheckoutSessionSummary | null>(null);

  const sessionId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("session_id") ?? params.get("sessionId") ?? "";
  }, [location.search]);

  useEffect(() => {
    async function load(): Promise<void> {
      if (!token) return;
      if (!sessionId) {
        setLoading(false);
        setError(t("thankYou.missingSession"));
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<CheckoutSessionSummary>(`/payments/checkout-session/${encodeURIComponent(sessionId)}`, { token });
        setSummary(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("thankYou.loadError"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, sessionId, t]);

  const promoText = useMemo(() => {
    if (!summary?.promo?.promo_code || !summary.promo.promo_discount_type) return null;
    if (summary.promo.promo_discount_type === "free") return t("thankYou.promoFree", { code: summary.promo.promo_code });
    if (summary.promo.promo_discount_type === "percent" && summary.promo.promo_discount_value != null) {
      return t("thankYou.promoPercent", { code: summary.promo.promo_code, value: summary.promo.promo_discount_value });
    }
    if (summary.promo.promo_discount_type === "fixed" && summary.promo.promo_discount_value != null) {
      return t("thankYou.promoFixed", { code: summary.promo.promo_code, value: (summary.promo.promo_discount_value / 100).toFixed(2) });
    }
    return t("thankYou.promo", { code: summary.promo.promo_code });
  }, [summary, t]);

  const baseAmount = summary?.promo?.base_amount_cents ?? null;
  const finalAmount = summary?.amount_cents ?? null;
  const showStriked = baseAmount != null && finalAmount != null && baseAmount > finalAmount;

  return (
    <section className="page thankyou-page">
      <ConfettiCanvas active={!loading && !error} />
      <article className="card thankyou-card">
        {loading ? (
          <p>{t("thankYou.loading")}</p>
        ) : error ? (
          <>
            <h1>{t("thankYou.title")}</h1>
            <p className="error-text">{error}</p>
            <Link className="btn" to="/offers">
              {t("thankYou.backToOffers")}
            </Link>
          </>
        ) : (
          <>
            <p className="thankyou-kicker">{t("thankYou.kicker")}</p>
            <h1 className="thankyou-title">{user?.pseudo ?? "!"}</h1>
            <p className="thankyou-subtitle">{t("thankYou.subtitle")}</p>

            <div className="thankyou-grid">
              <div className="thankyou-row">
                <span>{t("thankYou.orderNumber")}</span>
                <strong>{summary?.order_reference}</strong>
              </div>
              <div className="thankyou-row">
                <span>{t("thankYou.server")}</span>
                <strong>{summary?.server_name}</strong>
              </div>
              <div className="thankyou-row">
                <span>{t("thankYou.offer")}</span>
                <strong>{summary?.subscription_type === "essentiel" ? t("offers.planEssentialName") : t("offers.planPlusName")}</strong>
              </div>
              <div className="thankyou-row">
                <span>{t("thankYou.total")}</span>
                <strong>
                  {showStriked && baseAmount != null ? (
                    <>
                      <span className="thankyou-price-strike">{(baseAmount / 100).toFixed(2)} EUR</span>{" "}
                      <span>{(finalAmount / 100).toFixed(2)} EUR</span>
                    </>
                  ) : (
                    <span>{finalAmount != null ? `${(finalAmount / 100).toFixed(2)} EUR` : t("common.notAvailable", { defaultValue: "—" })}</span>
                  )}
                </strong>
              </div>
            </div>

            {promoText && <p className="thankyou-promo">{promoText}</p>}

            <div className="thankyou-actions">
              <Link className="btn" to="/dashboard">
                {t("thankYou.goDashboard")}
              </Link>
              <Link className="btn btn-ghost" to="/subscriptions">
                {t("thankYou.viewOrders")}
              </Link>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
