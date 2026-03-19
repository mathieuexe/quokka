import { db } from "../config/db.js";
export async function listBlogCategories() {
    const result = await db.query(`
      SELECT id, slug, label, created_at, updated_at
      FROM blog_categories
      ORDER BY label ASC
    `);
    return result.rows;
}
export async function isBlogCategorySlugTaken(slug, excludeId) {
    const result = await db.query(`
      SELECT id
      FROM blog_categories
      WHERE slug = $1
      ${excludeId ? "AND id <> $2" : ""}
      LIMIT 1
    `, excludeId ? [slug, excludeId] : [slug]);
    return Boolean(result.rows[0]);
}
export async function createBlogCategory(label, slug) {
    const result = await db.query(`
      INSERT INTO blog_categories (label, slug)
      VALUES ($1, $2)
      RETURNING id, slug, label, created_at, updated_at
    `, [label, slug]);
    return result.rows[0];
}
export async function updateBlogCategory(categoryId, label, slug) {
    const result = await db.query(`
      UPDATE blog_categories
      SET label = $2,
          slug = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, slug, label, created_at, updated_at
    `, [categoryId, label, slug]);
    return result.rows[0] ?? null;
}
export async function deleteBlogCategory(categoryId) {
    await db.query("DELETE FROM blog_categories WHERE id = $1", [categoryId]);
}
export async function listBlogPostsAdmin() {
    const result = await db.query(`
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
    `);
    return result.rows;
}
export async function getBlogPostById(postId) {
    const result = await db.query(`
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
    `, [postId]);
    return result.rows[0] ?? null;
}
export async function isBlogPostSlugTaken(slug, excludeId) {
    const result = await db.query(`
      SELECT id
      FROM blog_posts
      WHERE slug = $1
      ${excludeId ? "AND id <> $2" : ""}
      LIMIT 1
    `, excludeId ? [slug, excludeId] : [slug]);
    return Boolean(result.rows[0]);
}
export async function createBlogPost(input) {
    const result = await db.query(`
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
    `, [input.categoryId, input.slug, input.title, input.description, input.imageUrl, input.status]);
    return result.rows[0];
}
export async function updateBlogPost(input) {
    const result = await db.query(`
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
    `, [input.postId, input.categoryId, input.slug, input.title, input.description, input.imageUrl, input.status]);
    return result.rows[0] ?? null;
}
export async function deleteBlogPost(postId) {
    await db.query("DELETE FROM blog_posts WHERE id = $1", [postId]);
}
export async function listPublishedBlogPosts(categorySlug) {
    const params = [];
    const clauses = ["p.status = 'published'"];
    if (categorySlug) {
        params.push(categorySlug);
        clauses.push(`c.slug = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await db.query(`
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
    `, params);
    return result.rows;
}
export async function getPublishedBlogPostBySlug(slug) {
    const result = await db.query(`
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
    `, [slug]);
    return result.rows[0] ?? null;
}
