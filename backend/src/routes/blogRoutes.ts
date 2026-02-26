import { Router } from "express";
import { getPublicBlogPost, getPublicBlogPosts } from "../controllers/blogController.js";

export const blogRoutes = Router();

blogRoutes.get("/posts", getPublicBlogPosts);
blogRoutes.get("/posts/:slug", getPublicBlogPost);
