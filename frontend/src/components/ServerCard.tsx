import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import type { Server } from "../types";

type ServerCardProps = {
  server: Server;
  categoryLogoUrl?: string;
};

export function ServerCard({ server, categoryLogoUrl }: ServerCardProps): JSX.Element {
  const { token, isAuthenticated } = useAuth();
  const premiumLabel = server.premium_type === "quokka_plus" ? "Quokka+" : server.premium_type === "essentiel" ? "Essentiel" : null;
  const [copied, setCopied] = useState(false);
  const [likesCount, setLikesCount] = useState(server.likes ?? 0);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const safeCategoryLogoUrl = useMemo(() => categoryLogoUrl?.trim() ?? "", [categoryLogoUrl]);

  async function copyGameAddress(): Promise<void> {
    const target = server.ip && server.port ? `${server.ip}:${server.port}` : "";
    if (!target) return;
    await navigator.clipboard.writeText(target);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function vote(): Promise<void> {
    if (!isAuthenticated || !token) {
      window.alert("Connectez-vous pour voter.");
      return;
    }

    try {
      const response = await apiRequest<{ likes: number }>(`/servers/${server.id}/vote`, {
        method: "POST",
        token
      });
      setLikesCount(response.likes);
      setVoteMessage("Vote enregistré.");
      window.setTimeout(() => setVoteMessage(null), 1800);
    } catch (error) {
      setVoteMessage(error instanceof Error ? error.message : "Vote impossible.");
      window.setTimeout(() => setVoteMessage(null), 2500);
    }
  }

  return (
    <article className="card server-card">
      <div className="server-card-head">
        <h3 className="server-title">
          <span>{server.name}</span>
          {server.verified && (
            <img
              className="verified-icon"
              src="https://quokka.gg/images/icons/verified-icon.svg"
              alt="Serveur vérifié"
              title="Serveur vérifié"
            />
          )}
        </h3>
        <div className="server-badges">
          <span className="tag tag-with-icon">
            {safeCategoryLogoUrl && !logoFailed ? (
              <img
                className="tag-icon"
                src={safeCategoryLogoUrl}
                alt={`Logo ${server.category_label}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="tag-icon-fallback" aria-hidden="true">
                🎮
              </span>
            )}
            <span>{server.category_label}</span>
          </span>
          {premiumLabel && <span className="tag tag-premium">{premiumLabel}</span>}
        </div>
      </div>
      {server.banner_url && (
        <img className="server-card-banner" src={server.banner_url} alt={`Banniere de ${server.name}`} loading="lazy" />
      )}
      <p className="server-description">{server.description}</p>
      <div className="stats-row">
        <span>Vues: {server.views ?? 0}</span>
        <span>J'aime total : {likesCount}</span>
        <span>Visites: {server.visits ?? 0}</span>
      </div>
      {voteMessage && <p className={voteMessage === "Vote enregistré." ? "success-text" : "error-text"}>{voteMessage}</p>}
      <div className="server-card-actions">
        <button className="btn btn-ghost" type="button" onClick={() => void vote()}>
          Voter
        </button>
        {server.invite_link ? (
          <a className="btn" href={server.invite_link} target="_blank" rel="noreferrer">
            Rejoindre
          </a>
        ) : (
          <button className="btn" type="button" onClick={() => void copyGameAddress()}>
            {copied ? "IP:PORT copiée" : "Rejoindre"}
          </button>
        )}
        <Link className="btn btn-ghost" to={`/servers/${server.id}`}>
          Voir la fiche
        </Link>
      </div>
    </article>
  );
}
