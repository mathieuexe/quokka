import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

const createLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response, next, options) => {
      res.status(options.statusCode).json(options.message);
    }
  });
};

// strictLimiter : 5 requêtes / 15 min (login, register, reset password)
export const strictLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Trop de tentatives. Veuillez réessayer plus tard."
);

// standardLimiter : 30 requêtes / 1 min (votes, tickets, création)
export const standardLimiter = createLimiter(
  1 * 60 * 1000,
  30,
  "Trop de requêtes. Veuillez patienter quelques instants."
);

// publicLimiter : 100 requêtes / 1 min (routes publiques générales)
export const publicLimiter = createLimiter(
  1 * 60 * 1000,
  100,
  "Limite de requêtes atteinte. Veuillez ralentir."
);
