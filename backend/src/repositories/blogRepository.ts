import { db } from "../config/db.js";

export type BlogCategoryRecord = {
  id: string;
  slug: string;
  label: string;
  created_at: string;
  updated_at: string;
};

export type BlogPostRecord = {
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

export async function listBlogCategories(): Promise<BlogCategoryRecord[]> {
  const result = await db.query<BlogCategoryRecord>(
    `
      SELECT id, slug, label, created_at, updated_at
      FROM blog_categories
      ORDER BY label ASC
    `
  );
  return result.rows;
}

export async function isBlogCategorySlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const result = await db.query<{ id: string }>(
    `
      SELECT id
      FROM blog_categories
      WHERE slug = $1
      ${excludeId ? "AND id <> $2" : ""}
      LIMIT 1
    `,
    excludeId ? [slug, excludeId] : [slug]
  );
  return Boolean(result.rows[0]);
}

export async function createBlogCategory(label: string, slug: string): Promise<BlogCategoryRecord> {
  const result = await db.query<BlogCategoryRecord>(
    `
      INSERT INTO blog_categories (label, slug)
      VALUES ($1, $2)
      RETURNING id, slug, label, created_at, updated_at
    `,
    [label, slug]
  );
  return result.rows[0];
}

export async function updateBlogCategory(categoryId: string, label: string, slug: string): Promise<BlogCategoryRecord | null> {
  const result = await db.query<BlogCategoryRecord>(
    `
      UPDATE blog_categories
      SET label = $2,
          slug = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, slug, label, created_at, updated_at
    `,
    [categoryId, label, slug]
  );
  return result.rows[0] ?? null;
}

export async function deleteBlogCategory(categoryId: string): Promise<void> {
  await db.query("DELETE FROM blog_categories WHERE id = $1", [categoryId]);
}

export async function listBlogPostsAdmin(): Promise<BlogPostRecord[]> {
  const result = await db.query<BlogPostRecord>(
    `
      SELECT
        p.id,
        p.category_id,
        c.slug AS category_slug,
        c.label AS category_label,
        p.slug,
        p.title,
        p.description,
        p.image_url,
        p.status,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `
  );
  return result.rows;
}

export async function getBlogPostById(postId: string): Promise<BlogPostRecord | null> {
  const result = await db.query<BlogPostRecord>(
    `
      SELECT
        p.id,
        p.category_id,
        c.slug AS category_slug,
        c.label AS category_label,
        p.slug,
        p.title,
        p.description,
        p.image_url,
        p.status,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [postId]
  );
  return result.rows[0] ?? null;
}

export async function isBlogPostSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const result = await db.query<{ id: string }>(
    `
      SELECT id
      FROM blog_posts
      WHERE slug = $1
      ${excludeId ? "AND id <> $2" : ""}
      LIMIT 1
    `,
    excludeId ? [slug, excludeId] : [slug]
  );
  return Boolean(result.rows[0]);
}

export async function createBlogPost(input: {
  categoryId: string | null;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: "published" | "draft" | "private";
}): Promise<BlogPostRecord> {
  const result = await db.query<BlogPostRecord>(
    `
      INSERT INTO blog_posts (category_id, slug, title, description, image_url, status, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'published' THEN NOW() ELSE NULL END)
      RETURNING
        id,
        category_id,
        NULL::text AS category_slug,
        NULL::text AS category_label,
        slug,
        title,
        description,
        image_url,
        status,
        published_at,
        created_at,
        updated_at
    `,
    [input.categoryId, input.slug, input.title, input.description, input.imageUrl, input.status]
  );
  return result.rows[0];
}

export async function updateBlogPost(input: {
  postId: string;
  categoryId: string | null;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: "published" | "draft" | "private";
}): Promise<BlogPostRecord | null> {
  const result = await db.query<BlogPostRecord>(
    `
      UPDATE blog_posts
      SET category_id = $2,
          slug = $3,
          title = $4,
          description = $5,
          image_url = $6,
          status = $7,
          published_at = CASE
            WHEN $7 = 'published' AND published_at IS NULL THEN NOW()
            WHEN $7 <> 'published' THEN NULL
            ELSE published_at
          END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        category_id,
        NULL::text AS category_slug,
        NULL::text AS category_label,
        slug,
        title,
        description,
        image_url,
        status,
        published_at,
        created_at,
        updated_at
    `,
    [input.postId, input.categoryId, input.slug, input.title, input.description, input.imageUrl, input.status]
  );
  return result.rows[0] ?? null;
}

export async function deleteBlogPost(postId: string): Promise<void> {
  await db.query("DELETE FROM blog_posts WHERE id = $1", [postId]);
}

export async function listPublishedBlogPosts(categorySlug?: string): Promise<BlogPostRecord[]> {
  const params: string[] = [];
  const clauses = ["p.status = 'published'"];
  if (categorySlug) {
    params.push(categorySlug);
    clauses.push(`c.slug = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await db.query<BlogPostRecord>(
    `
      SELECT
        p.id,
        p.category_id,
        c.slug AS category_slug,
        c.label AS category_label,
        p.slug,
        p.title,
        p.description,
        p.image_url,
        p.status,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      ${where}
      ORDER BY p.published_at DESC, p.created_at DESC
    `,
    params
  );
  return result.rows;
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  const result = await db.query<BlogPostRecord>(
    `
      SELECT
        p.id,
        p.category_id,
        c.slug AS category_slug,
        c.label AS category_label,
        p.slug,
        p.title,
        p.description,
        p.image_url,
        p.status,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      WHERE p.slug = $1
        AND p.status = 'published'
      LIMIT 1
    `,
    [slug]
  );
  return result.rows[0] ?? null;
}
