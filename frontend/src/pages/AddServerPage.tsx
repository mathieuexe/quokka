import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";
import type { Category } from "../types";

type CategoriesResponse = { categories: Category[] };
const COMMUNITY_SLUGS = new Set(["discord", "stoat"]);

const COUNTRIES = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "CA", label: "Canada" },
  { code: "US", label: "États-Unis" },
  { code: "DE", label: "Allemagne" }
];

export function AddServerPage(): JSX.Element {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState(25565);
  const [isPublic, setIsPublic] = useState(true);
  const [inviteId, setInviteId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === categoryId) ?? null,
    [categories, categoryId]
  );
  const gamingCategories = useMemo(
    () => categories.filter((cat) => !COMMUNITY_SLUGS.has(cat.slug)),
    [categories]
  );
  const communityCategories = useMemo(
    () => categories.filter((cat) => COMMUNITY_SLUGS.has(cat.slug)),
    [categories]
  );
  const isDiscord = selectedCategory?.slug === "discord";
  const isStoat = selectedCategory?.slug === "stoat";
  const isCommunity = isDiscord || isStoat;

  useEffect(() => {
    async function loadCategories(): Promise<void> {
      try {
        const data = await apiRequest<CategoriesResponse>("/servers/categories");
        setCategories(data.categories);
        if (data.categories.length) {
          const firstGaming = data.categories.find((cat) => !COMMUNITY_SLUGS.has(cat.slug));
          setCategoryId((firstGaming ?? data.categories[0]).id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger les catégories.");
      }
    }
    void loadCategories();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const inviteLink = isDiscord
        ? `https://discord.gg/${inviteId}`
        : isStoat
          ? `https://stt.gg/${inviteId}`
          : undefined;

      await apiRequest<{ id: string }>("/servers", {
        method: "POST",
        token,
        body: {
          categoryId,
          name,
          website,
          description,
          bannerUrl,
          countryCode,
          ip: isCommunity ? undefined : ip,
          port: isCommunity ? undefined : Number(port),
          inviteLink,
          isPublic
        }
      });
      showToast("Serveur ajouté avec succès.");
      setInviteId("");
      setIp("");
      setDescription("");
      setBannerUrl("");
      setName("");
      setWebsite("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout serveur impossible.");
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="page">
        <h1>Ajouter serveur</h1>
        <p>Vous devez être connecté pour ajouter un serveur.</p>
      </section>
    );
  }

  return (
    <section className="page narrow">
      <h1>Ajouter un serveur</h1>
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Catégorie
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
            {gamingCategories.length > 0 && (
              <optgroup label="Gaming">
                {gamingCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
            )}
            {communityCategories.length > 0 && (
              <optgroup label="Communauté">
                {communityCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        <label>
          Nom du serveur
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label>
          Site web
          <input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} required />
        </label>

        <label>
          Banniere serveur (945x290) - lien Imgur
          <input
            type="url"
            value={bannerUrl}
            onChange={(event) => setBannerUrl(event.target.value)}
            placeholder="https://imgur.com/... ou https://i.imgur.com/..."
          />
        </label>

        <label>
          Pays
          <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} required>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </label>

        {!isCommunity ? (
          <>
            <label>
              IP serveur
              <input value={ip} onChange={(event) => setIp(event.target.value)} required />
            </label>
            <label>
              Port
              <input
                type="number"
                value={port}
                onChange={(event) => setPort(Number(event.target.value))}
                required
              />
            </label>
            <label className="inline-control">
              <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
              Serveur public
            </label>
          </>
        ) : (
          <label>
            {isDiscord ? "ID invitation (https://discord.gg/)" : "ID Stoat (https://stt.gg/)"}
            <input value={inviteId} onChange={(event) => setInviteId(event.target.value)} required />
          </label>
        )}

        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit">
          Publier
        </button>
      </form>
    </section>
  );
}
