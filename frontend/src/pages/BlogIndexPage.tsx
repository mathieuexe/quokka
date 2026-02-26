import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

type BlogPost = {
  id: string;
  category_label: string | null;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
};

export function BlogIndexPage(): JSX.Element {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
    []
  );

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<{ posts: BlogPost[] }>("/blog/posts");
        if (mounted) setPosts(data.posts);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Impossible de charger le blog.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="page">
      <div className="page-head">
        <h1>Blog</h1>
        <p>Actualités, conseils et nouveautés Quokka.</p>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : posts.length === 0 ? (
        <p className="dashboard-muted">Aucun post publié pour le moment.</p>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => {
            const date = post.published_at ?? post.created_at;
            return (
              <Link key={post.id} to={`/blog/${post.slug}`} className="card blog-card">
                {post.image_url ? (
                  <img className="blog-card-image" src={post.image_url} alt={post.title} loading="lazy" />
                ) : (
                  <div className="blog-card-image blog-card-image-fallback">Image</div>
                )}
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span>{post.category_label ?? "Sans catégorie"}</span>
                    <span>{formatter.format(new Date(date))}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
