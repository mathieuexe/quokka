import type { Request, Response } from "express";
import { z } from "zod";
import {
  createBlogCategory,
  createBlogPost,
  deleteBlogCategory,
  deleteBlogPost,
  getBlogPostById,
  getPublishedBlogPostBySlug,
  isBlogCategorySlugTaken,
  isBlogPostSlugTaken,
  listBlogCategories,
  listBlogPostsAdmin,
  listPublishedBlogPosts,
  updateBlogCategory,
  updateBlogPost
} from "../repositories/blogRepository.js";

const categorySchema = z.object({
  label: z.string().trim().min(2).max(80)
});

const categoryUpdateSchema = z.object({
  categoryId: z.string().uuid(),
  label: z.string().trim().min(2).max(80)
});

const postSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(2).max(20000),
  imageUrl: z.string().trim().url().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(["published", "draft", "private"])
});

const postUpdateSchema = postSchema.extend({
  postId: z.string().uuid()
});

function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "post";
}

async function buildUniqueSlug(
  base: string,
  check: (slug: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  let attempt = 1;
  while (await check(candidate)) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function getAdminBlogCategories(req: Request, res: Response): Promise<void> {
  const categories = await listBlogCategories();
  res.json({ categories });
}

export async function postAdminBlogCategory(req: Request, res: Response): Promise<void> {
  try {
    const payload = categorySchema.parse(req.body);
    const baseSlug = slugify(payload.label);
    const slug = await buildUniqueSlug(baseSlug, (value) => isBlogCategorySlugTaken(value));
    const category = await createBlogCategory(payload.label, slug);
    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Erreur serveur." });
  }
}

export async function patchAdminBlogCategory(req: Request, res: Response): Promise<void> {
  try {
    const payload = categoryUpdateSchema.parse(req.body);
    const baseSlug = slugify(payload.label);
    const slug = await buildUniqueSlug(baseSlug, (value) => isBlogCategorySlugTaken(value, payload.categoryId));
    const category = await updateBlogCategory(payload.categoryId, payload.label, slug);
    if (!category) {
      res.status(404).json({ message: "Catégorie introuvable." });
      return;
    }
    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Erreur serveur." });
  }
}

export async function deleteAdminBlogCategory(req: Request, res: Response): Promise<void> {
  const categoryId = z.string().uuid().safeParse(req.params.categoryId);
  if (!categoryId.success) {
    res.status(400).json({ message: "Identifiant de catégorie invalide." });
    return;
  }
  await deleteBlogCategory(categoryId.data);
  res.json({ message: "Catégorie supprimée." });
}

export async function getAdminBlogPosts(req: Request, res: Response): Promise<void> {
  const posts = await listBlogPostsAdmin();
  res.json({ posts });
}

export async function postAdminBlogPost(req: Request, res: Response): Promise<void> {
  try {
    const payload = postSchema.parse(req.body);
    const baseSlug = slugify(payload.title);
    const slug = await buildUniqueSlug(baseSlug, (value) => isBlogPostSlugTaken(value));
    const post = await createBlogPost({
      categoryId: payload.categoryId ?? null,
      slug,
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl?.trim() || null,
      status: payload.status
    });
    res.status(201).json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Erreur serveur." });
  }
}

export async function patchAdminBlogPost(req: Request, res: Response): Promise<void> {
  try {
    const payload = postUpdateSchema.parse(req.body);
    const existing = await getBlogPostById(payload.postId);
    if (!existing) {
      res.status(404).json({ message: "Article introuvable." });
      return;
    }
    const baseSlug = payload.title === existing.title ? existing.slug : slugify(payload.title);
    const slug = payload.title === existing.title
      ? existing.slug
      : await buildUniqueSlug(baseSlug, (value) => isBlogPostSlugTaken(value, payload.postId));
    const post = await updateBlogPost({
      postId: payload.postId,
      categoryId: payload.categoryId ?? null,
      slug,
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl?.trim() || null,
      status: payload.status
    });
    if (!post) {
      res.status(404).json({ message: "Article introuvable." });
      return;
    }
    res.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Erreur serveur." });
  }
}

export async function deleteAdminBlogPost(req: Request, res: Response): Promise<void> {
  const postId = z.string().uuid().safeParse(req.params.postId);
  if (!postId.success) {
    res.status(400).json({ message: "Identifiant de post invalide." });
    return;
  }
  await deleteBlogPost(postId.data);
  res.json({ message: "Post supprimé." });
}

export async function getPublicBlogPosts(req: Request, res: Response): Promise<void> {
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const posts = await listPublishedBlogPosts(category || undefined);
  res.json({ posts });
}

export async function getPublicBlogPost(req: Request, res: Response): Promise<void> {
  const slug = z.string().min(1).safeParse(req.params.slug);
  if (!slug.success) {
    res.status(400).json({ message: "Slug invalide." });
    return;
  }
  const post = await getPublishedBlogPostBySlug(slug.data);
  if (!post) {
    res.status(404).json({ message: "Post introuvable." });
    return;
  }
  res.json({ post });
}
