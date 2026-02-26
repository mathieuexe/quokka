import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

export function BlogPostPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
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
      if (!slug) {
        setError("Post introuvable.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<{ post: BlogPost }>(`/blog/posts/${slug}`);
        if (mounted) setPost(data.post);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Impossible de charger le post.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="page">
        <p>Chargement...</p>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="page">
        <p className="error-text">{error ?? "Post introuvable."}</p>
        <Link className="btn btn-ghost" to="/blog">
          Retour au blog
        </Link>
      </section>
    );
  }

  const date = post.published_at ?? post.created_at;

  return (
    <section className="page blog-post-page">
      <Link className="btn btn-ghost" to="/blog">
        Retour au blog
      </Link>
      <article className="card blog-post-card">
        <div className="blog-post-meta">
          <span>{post.category_label ?? "Sans catégorie"}</span>
          <span>{formatter.format(new Date(date))}</span>
        </div>
        <h1>{post.title}</h1>
        {post.image_url ? (
          <img className="blog-post-image" src={post.image_url} alt={post.title} />
        ) : (
          <div className="blog-post-image blog-card-image-fallback">Image</div>
        )}
        <p>{post.description}</p>
      </article>
    </section>
  );
}
