import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../lib/api";
import type { Server } from "../types";
import { ServerCard } from "../components/ServerCard";

type HomeResponse = { servers: Server[] };

export function HomePage(): JSX.Element {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadServers(nextSearch?: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const query = nextSearch?.trim() ? `?search=${encodeURIComponent(nextSearch.trim())}` : "";
      const data = await apiRequest<HomeResponse>(`/servers${query}`);
      setServers(data.servers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les serveurs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get("search") ?? "";
    if (initialSearch) {
      setSearch(initialSearch);
      void loadServers(initialSearch);
      return;
    }
    void loadServers();
  }, [location.search]);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void loadServers(search);
  }

  return (
    <section className="page home-page home-page-v2">
      <div className="home-v2-hero-bleed">
        <div className="home-v2-hero">
          <div className="home-v2-hero-inner">
            <div className="home-v2-hero-copy">
              <h1>Découvrir des serveurs</h1>
              <p className="home-v2-subtitle">Recherchez un serveur et rejoignez-le en un clic.</p>

              <form className="home-v2-search" onSubmit={onSubmit}>
                <div className="home-v2-search-row">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un serveur (nom, mot-clé...)"
                    aria-label="Rechercher un serveur"
                  />
                  <button className="btn" type="submit">
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="home-v2-cta-row">
                <Link className="btn home-v2-primary-cta" to="/add-server">
                  Ajouter mon serveur
                </Link>
              </div>
            </div>
            <div className="home-v2-hero-side">
              <article className="card home-v2-promo-card">
                <div>
                  <span className="home-v2-kicker">Promotion</span>
                  <h2>Boostez votre serveur</h2>
                  <p>Choisissez un serveur, sélectionnez l’offre et payez en toute sécurité.</p>
                  <ul className="home-v2-side-list">
                    <li>Sélection du serveur</li>
                    <li>Offre Essentiel ou Quokka+</li>
                    <li>Paiement et code promo</li>
                  </ul>
                </div>
                <Link className="btn home-v2-promo-btn" to="/offers">
                  Promouvoir mon serveur
                </Link>
              </article>
            </div>
          </div>
        </div>
      </div>

      <section className="home-v2-section" aria-label="Liste des serveurs">
        <div className="home-v2-section-head">
          <div>
            <h2>Serveurs</h2>
            <p>{servers.length} résultat(s)</p>
          </div>
        </div>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && servers.length === 0 && <p>Aucun serveur trouvé.</p>}
        <div className="home-v2-server-grid">
          {!loading && !error && servers.map((server) => <ServerCard key={server.id} server={server} />)}
        </div>
      </section>

      <section className="home-v2-section home-seo-section" aria-label="Annuaire serveurs Discord et gaming">
        <div className="home-v2-section-head">
          <div>
            <h2>Annuaire et promotion de serveurs Discord & gaming</h2>
            <p>Classement, visibilité et croissance pour votre communauté.</p>
          </div>
        </div>
        <div className="home-seo-content">
          <p>
            Quokka est un annuaire serveur Discord et une liste de serveurs Discord pour trouver un serveur Discord, un serveur discord
            français, un serveur discord gaming ou une communauté discord active. Ajoutez un serveur discord, faites un ajout serveur discord
            gratuit, publiez et faites la promotion: pub serveur discord, publicité serveur discord, pub serveur discord gratuit, top serveur
            discord, classement serveur discord, site pub serveur discord, booster serveur discord, visibilité serveur discord et référencement
            serveur discord.
          </p>
          <p>
            Notre plateforme couvre aussi les serveurs gaming: serveur fivem, serveur fivem france, serveur fivem RP, serveur fivem whitelist,
            annuaire serveur fivem, top serveur fivem et référencement serveur fivem. Retrouvez un serveur garrys mod, serveur gmod, serveur gmod
            RP, serveur gmod darkrp, annuaire serveur gmod, top serveur gmod, référencement serveur gmod, ainsi que serveur minecraft (RP, PVP,
            survie, moddé), serveur fortnite, serveur arma 3 (RP, milsim), serveur stoat, serveur multigaming, serveur gaming multijoueur,
            serveur jeu vidéo et serveur roleplay.
          </p>
          <p>
            Quokka est la plateforme pub serveur pour promouvoir un serveur gaming, améliorer la visibilité serveur discord, trouver un
            serveur discord actif et faire grandir votre communauté gaming en France.
          </p>
        </div>
      </section>
    </section>
  );
}
