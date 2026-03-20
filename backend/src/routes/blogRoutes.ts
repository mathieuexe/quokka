import { Router } from "express";
import { getPublicBlogPost, getPublicBlogPosts } from "../controllers/blogController.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

export const blogRoutes = Router();

blogRoutes.get("/posts", cacheMiddleware(300), getPublicBlogPosts);
blogRoutes.get("/posts/:slug", cacheMiddleware(300), getPublicBlogPost);
