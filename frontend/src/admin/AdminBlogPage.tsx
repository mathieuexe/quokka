import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../lib/api";

type BlogCategory = {
  id: string;
  slug: string;
  label: string;
  created_at: string;
  updated_at: string;
};

type BlogPost = {
  id: string;
  category_id: string | null;
  category_slug: string | null;
  category_label: string | null;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  status: "published" | "draft" | "private";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<BlogPost["status"], string> = {
  published: "Publié",
  draft: "Brouillon",
  private: "Privé"
};

export function AdminBlogPage(): JSX.Element {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [categoryLabel, setCategoryLabel] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryLabel, setEditingCategoryLabel] = useState("");

  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postCategoryId, setPostCategoryId] = useState<string>("");
  const [postStatus, setPostStatus] = useState<BlogPost["status"]>("draft");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  async function loadAll(): Promise<void> {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, postsData] = await Promise.all([
        apiRequest<{ categories: BlogCategory[] }>("/admin/blog/categories", { token }),
        apiRequest<{ posts: BlogPost[] }>("/admin/blog/posts", { token })
      ]);
      setCategories(categoriesData.categories);
      setPosts(postsData.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger le blog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [token]);

  const categoryOptions = useMemo(
    () => [
      { id: "", label: "Sans catégorie" },
      ...categories.map((category) => ({ id: category.id, label: category.label }))
    ],
    [categories]
  );

  async function onCreateCategory(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await apiRequest<{ category: BlogCategory }>("/admin/blog/categories", {
        method: "POST",
        token,
        body: { label: categoryLabel }
      });
      setCategoryLabel("");
      await loadAll();
      showToast("Catégorie créée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création de la catégorie impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdateCategory(): Promise<void> {
    if (!token || !editingCategoryId) return;
    setSubmitting(true);
    try {
      await apiRequest<{ category: BlogCategory }>("/admin/blog/categories", {
        method: "PATCH",
        token,
        body: { categoryId: editingCategoryId, label: editingCategoryLabel }
      });
      setEditingCategoryId(null);
      setEditingCategoryLabel("");
      await loadAll();
      showToast("Catégorie mise à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteCategory(categoryId: string): Promise<void> {
    if (!token) return;
    setSubmitting(true);
    try {
      await apiRequest<void>(`/admin/blog/categories/${categoryId}`, {
        method: "DELETE",
        token
      });
      await loadAll();
      showToast("Catégorie supprimée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitPost(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: postTitle,
        description: postDescription,
        imageUrl: postImageUrl.trim() ? postImageUrl.trim() : null,
        categoryId: postCategoryId || null,
        status: postStatus
      };
      if (editingPostId) {
        await apiRequest<{ post: BlogPost }>("/admin/blog/posts", {
          method: "PATCH",
          token,
          body: { postId: editingPostId, ...payload }
        });
        showToast("Post mis à jour.");
      } else {
        await apiRequest<{ post: BlogPost }>("/admin/blog/posts", {
          method: "POST",
          token,
          body: payload
        });
        showToast("Post créé.");
      }
      setPostTitle("");
      setPostDescription("");
      setPostImageUrl("");
      setPostCategoryId("");
      setPostStatus("draft");
      setEditingPostId(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditPost(post: BlogPost): void {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostDescription(post.description);
    setPostImageUrl(post.image_url ?? "");
    setPostCategoryId(post.category_id ?? "");
    setPostStatus(post.status);
  }

  function resetPostForm(): void {
    setEditingPostId(null);
    setPostTitle("");
    setPostDescription("");
    setPostImageUrl("");
    setPostCategoryId("");
    setPostStatus("draft");
  }

  async function onDeletePost(postId: string): Promise<void> {
    if (!token) return;
    setSubmitting(true);
    try {
      await apiRequest<void>(`/admin/blog/posts/${postId}`, {
        method: "DELETE",
        token
      });
      await loadAll();
      showToast("Post supprimé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>Blog</h2>
        <p>Créez des catégories et gérez les posts du blog.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <article className="card">
        <div className="admin-topbar" style={{ padding: "0.6rem 0.8rem" }}>
          <div>
            <h3 style={{ margin: 0 }}>Catégories</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>Classez vos posts par thématique.</p>
          </div>
        </div>
        <form className="form" onSubmit={onCreateCategory}>
          <label>
            Nouvelle catégorie
            <input value={categoryLabel} onChange={(event) => setCategoryLabel(event.target.value)} placeholder="Actualités" required />
          </label>
          <button className="btn" type="submit" disabled={submitting || !categoryLabel.trim()}>
            Créer la catégorie
          </button>
        </form>
        {loading ? (
          <p>Chargement...</p>
        ) : categories.length === 0 ? (
          <p className="dashboard-muted">Aucune catégorie pour le moment.</p>
        ) : (
          <div className="admin-list-grid" style={{ marginTop: "0.6rem" }}>
            {categories.map((category) => (
              <div key={category.id} className="admin-list-item static">
                <div>
                  <h3 style={{ margin: 0 }}>{category.label}</h3>
                  <p style={{ margin: "0.15rem 0 0" }}>Slug: {category.slug}</p>
                </div>
                <div className="admin-user-actions">
                  {editingCategoryId === category.id ? (
                    <>
                      <input
                        value={editingCategoryLabel}
                        onChange={(event) => setEditingCategoryLabel(event.target.value)}
                        placeholder="Nom de la catégorie"
                      />
                      <button className="btn" type="button" onClick={() => void onUpdateCategory()} disabled={submitting}>
                        Enregistrer
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategoryLabel("");
                        }}
                        disabled={submitting}
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditingCategoryLabel(category.label);
                        }}
                      >
                        Modifier
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => void onDeleteCategory(category.id)} disabled={submitting}>
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="card">
        <div className="admin-topbar" style={{ padding: "0.6rem 0.8rem" }}>
          <div>
            <h3 style={{ margin: 0 }}>{editingPostId ? "Modifier un post" : "Créer un post"}</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>Titre, description, image et statut.</p>
          </div>
        </div>
        <form className="form" onSubmit={onSubmitPost}>
          <label>
            Titre
            <input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} required />
          </label>
          <label>
            Description
            <textarea rows={5} value={postDescription} onChange={(event) => setPostDescription(event.target.value)} required />
          </label>
          <label>
            Image (URL)
            <input type="url" value={postImageUrl} onChange={(event) => setPostImageUrl(event.target.value)} placeholder="https://..." />
          </label>
          <div className="admin-inline-grid">
            <label>
              Catégorie
              <select value={postCategoryId} onChange={(event) => setPostCategoryId(event.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Statut
              <select value={postStatus} onChange={(event) => setPostStatus(event.target.value as BlogPost["status"])}>
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
                <option value="private">Privé</option>
              </select>
            </label>
          </div>
          <div className="admin-user-actions">
            <button className="btn" type="submit" disabled={submitting}>
              {editingPostId ? "Enregistrer" : "Créer le post"}
            </button>
            {editingPostId && (
              <button className="btn btn-ghost" type="button" onClick={resetPostForm} disabled={submitting}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="card">
        <div className="admin-topbar" style={{ padding: "0.6rem 0.8rem" }}>
          <div>
            <h3 style={{ margin: 0 }}>Posts existants</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>Liste des posts du blog.</p>
          </div>
        </div>
        {loading ? (
          <p>Chargement...</p>
        ) : posts.length === 0 ? (
          <p className="dashboard-muted">Aucun post pour le moment.</p>
        ) : (
          <div className="admin-list-grid" style={{ marginTop: "0.6rem" }}>
            {posts.map((post) => (
              <div key={post.id} className="admin-list-item static">
                <div>
                  <h3 style={{ margin: 0 }}>{post.title}</h3>
                  <p style={{ margin: "0.15rem 0 0" }}>
                    {post.category_label ?? "Sans catégorie"} · {STATUS_LABELS[post.status]} · {post.slug}
                  </p>
                </div>
                <div className="admin-user-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => startEditPost(post)}>
                    Modifier
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => void onDeletePost(post.id)} disabled={submitting}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
