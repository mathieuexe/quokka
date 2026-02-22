import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import type { Server } from "../types";

type ServerResponse = { server: Server };

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://quokka.gg";
const DEFAULT_IMAGE = `${SITE_URL}/images/logo/logorond.png`;

function resolveImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `https://quokka.gg${trimmed}`;
  return trimmed;
}

function toMetaDescription(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 157).trim()}...`;
}

function setMetaTag(name: string, content: string): void {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string): void {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function ServerPage(): JSX.Element {
  const { token, isAuthenticated } = useAuth();
  const { serverId } = useParams();
  const [server, setServer] = useState<Server | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const premiumLabel =
    server?.premium_type === "quokka_plus" ? "Quokka+" : server?.premium_type === "essentiel" ? "Essentiel" : null;

  useEffect(() => {
    async function loadServer(): Promise<void> {
      if (!serverId) return;
      try {
        const data = await apiRequest<ServerResponse>(`/servers/${serverId}`, { token });
        setServer(data.server);
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Impossible de charger le serveur.");
      }
    }
    void loadServer();
  }, [serverId, token]);

  useEffect(() => {
    if (!server) return;
    const title = `${server.name} — Serveur Discord | Quokka`;
    const description = toMetaDescription(
      server.description,
      "Fiche serveur Discord et gaming sur Quokka avec description, statistiques et lien pour rejoindre la communauté."
    );
    const canonical = new URL(`/servers/${server.id}`, SITE_URL).toString();
    const image = server.banner_url?.trim() ? server.banner_url : DEFAULT_IMAGE;

    document.title = title;
    setMetaTag("description", description);
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonical);
    setMetaProperty("og:image", image);
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", image);

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonical);
    } else {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonical);
      document.head.appendChild(link);
    }
  }, [server]);

  if (loadError) {
    return (
      <section className="page">
        <p className="error-text">{loadError}</p>
      </section>
    );
  }

  if (!server) {
    return (
      <section className="page">
        <p>Chargement du serveur...</p>
      </section>
    );
  }

  async function copyGameAddress(): Promise<void> {
    const currentServer = server;
    if (!currentServer) return;
    const target = currentServer.ip && currentServer.port ? `${currentServer.ip}:${currentServer.port}` : "";
    if (!target) return;
    await navigator.clipboard.writeText(target);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function vote(): Promise<void> {
    if (!isAuthenticated || !token) {
      setVoteError("Connectez-vous pour voter.");
      window.setTimeout(() => setVoteError(null), 2000);
      return;
    }
    const serverIdToVote = server?.id;
    if (!serverIdToVote) return;

    try {
      const response = await apiRequest<{ likes: number }>(`/servers/${serverIdToVote}/vote`, {
        method: "POST",
        token
      });
      setServer((current) => (current ? { ...current, likes: response.likes } : current));
      setVoteMessage("Vote enregistré.");
      setVoteError(null);
      window.setTimeout(() => setVoteMessage(null), 1800);
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : "Vote impossible.");
      window.setTimeout(() => setVoteError(null), 2600);
    }
  }

  return (
    <section className="page server-detail-page">
      <article className="card server-detail-card">
        {server.banner_url && (
          <img
            className="server-banner server-detail-banner"
            src={server.banner_url}
            alt={`Banniere de ${server.name}`}
            loading="lazy"
          />
        )}

        <div className="server-detail-head">
          <div className="server-detail-title-block">
            <h1 className="server-title">
              {server.category_image_url ? (
                <img
                  className="server-category-icon"
                  src={resolveImageUrl(server.category_image_url)}
                  alt={`Logo ${server.category_label}`}
                  loading="lazy"
                />
              ) : null}
              <span>{server.name}</span>
              {server.verified && (
                <img
                  className="verified-icon"
                  src="/images/badges/blue-verified-badge.png"
                  alt="Serveur vérifié"
                  title="Serveur vérifié"
                />
              )}
            </h1>
            <div className="server-detail-tags">
              <span className="tag">{server.category_label}</span>
              {premiumLabel && <span className="tag tag-premium">{premiumLabel}</span>}
            </div>
          </div>

          <div className="server-owner-box">
            <span className="server-owner-label">Créé par</span>
            <Link className="server-owner-link" to={`/users/${server.user_id}`}>
              {server.user_avatar_url ? (
                <img className="profile-avatar server-owner-avatar" src={server.user_avatar_url} alt={`Avatar de ${server.user_pseudo}`} />
              ) : (
                <span className="profile-avatar profile-avatar-fallback server-owner-avatar">U</span>
              )}
              <span>{server.user_pseudo}</span>
            </Link>
          </div>
        </div>

        <p className="server-description">{server.description}</p>

        <div className="server-detail-actions">
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
          <Link className="btn btn-ghost" to="/">
            Retour à l’accueil
          </Link>
        </div>

        {voteMessage && <p className="success-text">{voteMessage}</p>}
        {voteError && <p className="error-text">{voteError}</p>}

        <div className="server-detail-meta-grid">
          <div className="server-detail-meta-item">
            <span>Référence</span>
            <strong>#{server.reference_number}</strong>
          </div>
          <div className="server-detail-meta-item">
            <span>Pays</span>
            <strong>{server.country_code}</strong>
          </div>
          {server.website ? (
            <div className="server-detail-meta-item">
              <span>Site web</span>
              <a href={server.website} target="_blank" rel="noreferrer">
                {server.website}
              </a>
            </div>
          ) : (
            <div className="server-detail-meta-item">
              <span>Site web</span>
              <strong>Non renseigné</strong>
            </div>
          )}
          {server.invite_link ? (
            <div className="server-detail-meta-item">
              <span>Accès communauté</span>
              <a href={server.invite_link} target="_blank" rel="noreferrer">
                Ouvrir le lien
              </a>
            </div>
          ) : (
            <div className="server-detail-meta-item">
              <span>Connexion</span>
              <strong>
                {server.ip}:{server.port}
              </strong>
            </div>
          )}
        </div>

        <div className="server-detail-stats-grid">
          <div className="server-detail-stat">
            <span>Vues</span>
            <strong>{server.views}</strong>
          </div>
          <div className="server-detail-stat">
            <span>J’aime total</span>
            <strong>{server.likes}</strong>
          </div>
          <div className="server-detail-stat">
            <span>Visites</span>
            <strong>{server.visits}</strong>
          </div>
          <div className="server-detail-stat">
            <span>Clics</span>
            <strong>{server.clicks}</strong>
          </div>
        </div>
      </article>
    </section>
  );
}
