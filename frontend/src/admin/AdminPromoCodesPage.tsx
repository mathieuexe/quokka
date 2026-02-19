import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";

type PromoCode = {
  id: string;
  code: string;
  is_active: boolean;
  discount_type: "fixed" | "percent" | "free";
  discount_value: number;
  user_id: string | null;
  user_pseudo: string | null;
  server_id: string | null;
  server_name: string | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
};

type Scope = "global" | "user" | "server" | "user_server";
type DiscountType = PromoCode["discount_type"];

function formatDiscount(promo: PromoCode): string {
  if (promo.discount_type === "free") return "Gratuit";
  if (promo.discount_type === "percent") return `-${promo.discount_value}%`;
  return `-${(promo.discount_value / 100).toFixed(2)} EUR`;
}

export function AdminPromoCodesPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [scope, setScope] = useState<Scope>("global");
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [amountEuros, setAmountEuros] = useState<number>(5);
  const [percent, setPercent] = useState<number>(20);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  async function loadPromoCodes(): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ promoCodes: PromoCode[] }>("/admin/promo-codes", { token });
      setPromoCodes(data.promoCodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les codes promo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPromoCodes();
  }, [token]);

  const resolvedScope = useMemo(() => {
    const u = userId.trim();
    const s = serverId.trim();
    if (scope === "global") return { userId: undefined, serverId: undefined };
    if (scope === "user") return { userId: u || undefined, serverId: undefined };
    if (scope === "server") return { userId: undefined, serverId: s || undefined };
    return { userId: u || undefined, serverId: s || undefined };
  }, [scope, userId, serverId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<{ promoCode: PromoCode }>("/admin/promo-codes", {
        method: "POST",
        token,
        body: {
          code,
          scope,
          userId: resolvedScope.userId,
          serverId: resolvedScope.serverId,
          type: discountType,
          amountEuros: discountType === "fixed" ? amountEuros : undefined,
          percent: discountType === "percent" ? percent : undefined,
          maxUses: maxUses.trim() ? Number(maxUses) : undefined,
          expiresAt: expiresAt ? new Date(`${expiresAt}T00:00:00`).toISOString() : undefined,
          isActive
        }
      });
      showToast("Code promo créé.");
      setCode("");
      setUserId("");
      setServerId("");
      setMaxUses("");
      setExpiresAt("");
      setIsActive(true);
      await loadPromoCodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création du code promo impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setActive(promoCodeId: string, nextActive: boolean): Promise<void> {
    if (!token) return;
    try {
      await apiRequest<void>("/admin/promo-codes/active", {
        method: "PATCH",
        token,
        body: { promoCodeId, isActive: nextActive }
      });
      setPromoCodes((current) => current.map((p) => (p.id === promoCodeId ? { ...p, is_active: nextActive } : p)));
      showToast(nextActive ? "Code activé." : "Code désactivé.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Codes promo</h2>
        <p>Créez des codes pour tous, un utilisateur précis ou un serveur précis.</p>
      </div>

      <article className="card">
        <form className="form" onSubmit={onSubmit}>
          {error && <p className="error-text">{error}</p>}
          <label>
            Code
            <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="QUOKKA2026" required />
          </label>
          <label>
            Portée
            <select value={scope} onChange={(event) => setScope(event.target.value as Scope)}>
              <option value="global">Tout le monde</option>
              <option value="user">Utilisateur précis</option>
              <option value="server">Serveur précis</option>
              <option value="user_server">Utilisateur + serveur</option>
            </select>
          </label>
          {(scope === "user" || scope === "user_server") && (
            <label>
              User ID (UUID)
              <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="uuid utilisateur" required={scope === "user" || scope === "user_server"} />
            </label>
          )}
          {(scope === "server" || scope === "user_server") && (
            <label>
              Server ID (UUID)
              <input value={serverId} onChange={(event) => setServerId(event.target.value)} placeholder="uuid serveur" required={scope === "server" || scope === "user_server"} />
            </label>
          )}
          <label>
            Type de réduction
            <select value={discountType} onChange={(event) => setDiscountType(event.target.value as DiscountType)}>
              <option value="percent">Pourcentage</option>
              <option value="fixed">Montant (EUR)</option>
              <option value="free">Gratuité</option>
            </select>
          </label>
          {discountType === "percent" && (
            <label>
              Pourcentage (%)
              <input type="number" min={1} max={100} value={percent} onChange={(event) => setPercent(Number(event.target.value))} />
            </label>
          )}
          {discountType === "fixed" && (
            <label>
              Montant (EUR)
              <input type="number" min={0.01} step={0.01} value={amountEuros} onChange={(event) => setAmountEuros(Number(event.target.value))} />
            </label>
          )}
          <label>
            Nombre max d’utilisations (optionnel)
            <input value={maxUses} onChange={(event) => setMaxUses(event.target.value)} placeholder="ex: 50" />
          </label>
          <label>
            Expire le (optionnel)
            <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
          <label className="inline-control">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Code actif
          </label>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Création..." : "Créer le code promo"}
          </button>
        </form>
      </article>

      <article className="card">
        <h3>Liste</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : promoCodes.length === 0 ? (
          <p>Aucun code promo.</p>
        ) : (
          <div className="admin-table-wrap">
            {promoCodes.map((promo) => (
              <article key={promo.id} className="admin-list-item static">
                <div>
                  <h3>{promo.code}</h3>
                  <p>
                    {formatDiscount(promo)} · Utilisations {promo.uses_count}
                    {promo.max_uses ? `/${promo.max_uses}` : ""} ·{" "}
                    {promo.user_pseudo ? `Utilisateur: ${promo.user_pseudo}` : promo.user_id ? `Utilisateur: ${promo.user_id}` : "Tous"} ·{" "}
                    {promo.server_name ? `Serveur: ${promo.server_name}` : promo.server_id ? `Serveur: ${promo.server_id}` : "Tous"}
                  </p>
                </div>
                <div className="admin-list-item-meta">
                  <span className={`status-pill ${promo.is_active ? "status-paid" : "status-failed"}`}>{promo.is_active ? "Actif" : "Inactif"}</span>
                  {promo.expires_at ? <span className="status-pill status-pending">Expire</span> : <span className="status-pill status-info">Sans date</span>}
                  <button className="btn btn-ghost" type="button" onClick={() => void setActive(promo.id, !promo.is_active)}>
                    {promo.is_active ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

