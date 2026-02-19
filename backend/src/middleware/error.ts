import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Ressource introuvable." });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Données invalides.",
      issues: err.issues
    });
    return;
  }

  console.error("[API ERROR]", err);
  res.status(500).json({ message: "Erreur interne serveur." });
}
