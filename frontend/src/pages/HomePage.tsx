import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../lib/api";
import type { Category, Server } from "../types";
import { ServerCard } from "../components/ServerCard";

type HomeResponse = { servers: Server[] };
type CategoriesResponse = { categories: Category[] };

function normalizeCategoryLabel(label: string): string {
  return label.trim().toLowerCase();
}

function manualCategoryLogoByLabel(label: string): string | null {
  const normalized = normalizeCategoryLabel(label);
  const logos: Record<string, string> = {
    "arma 3": "https://upload.wikimedia.org/wikipedia/commons/c/c7/ArmA_3_Logo_%28Black_Transparent%29.png",
    "counter strike": "https://logos-world.net/wp-content/uploads/2023/02/CSGO-Emblem.png",
    "counter-strike": "https://logos-world.net/wp-content/uploads/2023/02/CSGO-Emblem.png",
    discord: "https://upload.wikimedia.org/wikipedia/fr/thumb/4/4f/Discord_Logo_sans_texte.svg/960px-Discord_Logo_sans_texte.svg.png",
    "gta v": "https://www.rockstarmag.fr/wp-content/uploads/2015/09/Grand-Theft-Auto-V.png",
    "gta v (fivem)": "https://www.rockstarmag.fr/wp-content/uploads/2015/09/Grand-Theft-Auto-V.png",
    "garry's mod": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Garry%27s_Mod_logo.svg/500px-Garry%27s_Mod_logo.svg.png",
    hytale: "https://upload.wikimedia.org/wikipedia/en/b/ba/Hytale_logo.png",
    minecraft: "https://cdn.freebiesupply.com/logos/large/2x/minecraft-1-logo-svg-vector.svg",
    bedrock: "https://cdn.freebiesupply.com/logos/large/2x/minecraft-1-logo-svg-vector.svg",
    roblox: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Roblox_Corporation_2025_logo.svg/960px-Roblox_Corporation_2025_logo.svg.png",
    rust: "https://logos-marques.com/wp-content/uploads/2025/03/Rust-Emblem.png",
    stoat:
      "https://cdn.bsky.app/img/avatar/plain/did:plc:qyajbfzm2uhjni6gnkgboga2/bafkreiexpqtfjezmbnttj2xjwlb42tq2qgguqdbfagik7jowoavz4kdrz4@jpeg"
  };
  return logos[normalized] ?? null;
}

function categoryDomainByLabel(label: string): string | null {
  const normalized = normalizeCategoryLabel(label);
  const domainMap: Record<string, string> = {
    "arma 3": "arma3.com",
    bedrock: "minecraft.net",
    "counter strike": "counter-strike.net",
    discord: "discord.com",
    "gta v (fivem)": "rockstargames.com",
    "garry's mod": "garrysmod.com",
    hytale: "hytale.com",
    minecraft: "minecraft.net",
    roblox: "roblox.com",
    rust: "facepunch.com",
    stoat: "stoat.chat"
  };
  return domainMap[normalized] ?? null;
}

export function HomePage(): JSX.Element {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [servers, setServers] = useState<Server[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"trending" | "new" | "views">("trending");
  const [failedCategoryLogos, setFailedCategoryLogos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const verifiedCount = servers.filter((server) => server.verified).length;
  const premiumCount = servers.filter((server) => server.premium_type !== null).length;
  const featuredServers = useMemo(() => servers.filter((server) => server.premium_type !== null), [servers]);
  const domainLogoById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, category) => {
        const domain = categoryDomainByLabel(category.label);
        if (domain) {
          acc[category.id] = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(`https://${domain}`)}`;
        }
        return acc;
      }, {}),
    [categories]
  );
  const fallbackLogoById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, category) => {
        const manualLogo = manualCategoryLogoByLabel(category.label);
        acc[category.id] = manualLogo || category.image_url || domainLogoById[category.id] || "";
        return acc;
      }, {}),
    [categories, domainLogoById]
  );
  const resolvedLogoById = fallbackLogoById;

  function markCategoryLogoAsFailed(categoryId: string): void {
    setFailedCategoryLogos((current) => {
      if (current[categoryId]) return current;
      return { ...current, [categoryId]: true };
    });
  }
  const displayedServers = useMemo(
    () =>
      selectedCategoryId === "all" ? servers : servers.filter((server) => server.category_id === selectedCategoryId),
    [selectedCategoryId, servers]
  );
  const sortedDisplayedServers = useMemo(() => {
    const next = [...displayedServers];
    if (sortMode === "new") {
      next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return next;
    }
    if (sortMode === "views") {
      next.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      return next;
    }
    next.sort((a, b) => {
      const likesDiff = (b.likes ?? 0) - (a.likes ?? 0);
      if (likesDiff !== 0) return likesDiff;
      const visitsDiff = (b.visits ?? 0) - (a.visits ?? 0);
      if (visitsDiff !== 0) return visitsDiff;
      return (b.views ?? 0) - (a.views ?? 0);
    });
    return next;
  }, [displayedServers, sortMode]);

  const trendingServers = useMemo(() => {
    const next = [...servers];
    next.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    return next.slice(0, 8);
  }, [servers]);

  const recentServers = useMemo(() => {
    const next = [...servers];
    next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return next.slice(0, 8);
  }, [servers]);

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

  useEffect(() => {
    async function loadCategories(): Promise<void> {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const data = await apiRequest<CategoriesResponse>("/servers/categories");
        setCategories(data.categories);
      } catch (e) {
        setCategoriesError(e instanceof Error ? e.message : "Impossible de charger les catégories.");
      } finally {
        setCategoriesLoading(false);
      }
    }
    void loadCategories();
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void loadServers(search);
  }

  return (
    <section className="page home-page home-page-v2">
      <div className="home-v2-hero-bleed">
        <div className="home-v2-hero">
          <div className="home-v2-hero-orb home-v2-hero-orb-a" aria-hidden="true" />
          <div className="home-v2-hero-orb home-v2-hero-orb-b" aria-hidden="true" />
          <div className="home-v2-hero-orb home-v2-hero-orb-c" aria-hidden="true" />

          <div className="home-v2-hero-inner">
            <div className="home-v2-hero-copy">
              <span className="home-v2-kicker">Plateforme de découverte & promotion de serveurs</span>
              <h1>Une meilleure façon de trouver votre prochaine communauté</h1>
              <p className="home-v2-subtitle">
                Explorez les serveurs par catégories, comparez en un coup d’œil, et rejoignez en quelques secondes.
              </p>

              <form className="home-v2-search" onSubmit={onSubmit}>
                <div className="home-v2-search-row">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un serveur (nom, mot-clé...)"
                    aria-label="Rechercher un serveur"
                  />
                  <select
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                    aria-label="Filtrer par catégorie"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)} aria-label="Trier">
                    <option value="trending">Tendance</option>
                    <option value="new">Récents</option>
                    <option value="views">Vues</option>
                  </select>
                  <button className="btn" type="submit">
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="home-v2-metrics">
                <span className="home-v2-metric">
                  <strong>{servers.length}</strong>
                  <span>serveurs</span>
                </span>
                <span className="home-v2-metric">
                  <strong>{verifiedCount}</strong>
                  <span>vérifiés</span>
                </span>
                <span className="home-v2-metric">
                  <strong>{premiumCount}</strong>
                  <span>premium</span>
                </span>
              </div>

              <div className="home-v2-cta-row">
                <Link className="btn home-v2-primary-cta" to="/add-server">
                  Ajouter mon serveur
                </Link>
                <a className="btn btn-ghost home-v2-secondary-cta" href="#explorer">
                  Explorer les serveurs
                </a>
              </div>
            </div>

            <aside className="home-v2-hero-side">
              <div className="home-v2-side-card">
                <h2>Pourquoi Quokka ?</h2>
                <ul className="home-v2-side-list">
                  <li>Navigation rapide, pensée mobile</li>
                  <li>Filtres & tri utiles (tendance, récents, vues)</li>
                  <li>Pages serveurs détaillées et claires</li>
                  <li>Vote & mise en avant pour booster votre visibilité</li>
                </ul>
              </div>
              <div className="home-v2-side-card home-v2-side-card-accent">
                <h3>Boostez votre visibilité</h3>
                <p>Activez Quokka+ ou Essentiel pour apparaître dans la section mise en avant.</p>
                <Link className="btn btn-ghost home-v2-side-btn" to="/offers">
                  Voir les offres
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <section className="home-v2-highlight">
        <div className="home-v2-highlight-inner">
          <div className="home-v2-highlight-card">
            <h2>Les plus populaires du moment</h2>
            <p>Basé sur les votes récents.</p>
          </div>
          <div className="home-v2-mini-grid">
            {!loading &&
              !error &&
              trendingServers.map((server) => (
                <ServerCard key={server.id} server={server} categoryLogoUrl={resolvedLogoById[server.category_id]} />
              ))}
          </div>
        </div>
      </section>

      <section className="home-v2-section" aria-label="Serveurs mis en avant">
        <div className="home-v2-section-head">
          <div>
            <h2>Serveurs mis en avant</h2>
            <p>Serveurs avec abonnement actif (Quokka+ / Essentiel).</p>
          </div>
        </div>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && featuredServers.length === 0 && <p>Aucun serveur mis en avant pour le moment.</p>}

        <div className="home-v2-server-grid">
          {!loading &&
            !error &&
            featuredServers.map((server) => (
              <ServerCard key={server.id} server={server} categoryLogoUrl={resolvedLogoById[server.category_id]} />
            ))}
        </div>
      </section>

      <section className="home-v2-section" id="explorer">
        <div className="home-v2-section-head">
          <div>
            <h2>Explorer</h2>
            <p>Filtrez par catégories et triez selon ce qui compte pour vous.</p>
          </div>
        </div>

        <div className="home-v2-filters">
          <div className="home-v2-chips" role="list">
            <button
              type="button"
              className={`home-v2-chip ${selectedCategoryId === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategoryId("all")}
            >
              <span className="home-v2-chip-icon" aria-hidden="true">
                🌐
              </span>
              <span>Toutes</span>
            </button>
            {categoriesLoading && <span className="home-v2-chip-skeleton">Chargement…</span>}
            {!categoriesLoading &&
              !categoriesError &&
              categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`home-v2-chip ${selectedCategoryId === category.id ? "active" : ""}`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {resolvedLogoById[category.id] && !failedCategoryLogos[category.id] ? (
                    <img
                      className="home-v2-chip-img"
                      src={resolvedLogoById[category.id]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => markCategoryLogoAsFailed(category.id)}
                    />
                  ) : (
                    <span className="home-v2-chip-icon" aria-hidden="true">
                      🎮
                    </span>
                  )}
                  <span>{category.label}</span>
                </button>
              ))}
          </div>
          {categoriesError && <p className="error-text">{categoriesError}</p>}
        </div>

        <div className="home-v2-subsection">
          <div className="home-v2-subsection-head">
            <h3>Nouveautés</h3>
            <p>Les derniers serveurs ajoutés.</p>
          </div>
          <div className="home-v2-mini-grid">
            {!loading &&
              !error &&
              recentServers.map((server) => (
                <ServerCard key={server.id} server={server} categoryLogoUrl={resolvedLogoById[server.category_id]} />
              ))}
          </div>
        </div>

        <div className="home-v2-subsection">
          <div className="home-v2-subsection-head">
            <h3>Tous les serveurs</h3>
            <p>
              {selectedCategoryId === "all"
                ? "Classement global."
                : `Catégorie : ${categories.find((c) => c.id === selectedCategoryId)?.label ?? "Sélection"}.`}
            </p>
          </div>

          {!loading && !error && sortedDisplayedServers.length === 0 && <p>Aucun serveur ne correspond à ce filtre.</p>}

          <div className="home-v2-server-grid">
            {!loading &&
              !error &&
              sortedDisplayedServers.map((server) => (
                <ServerCard key={server.id} server={server} categoryLogoUrl={resolvedLogoById[server.category_id]} />
              ))}
          </div>
        </div>
      </section>
    </section>
  );
}
