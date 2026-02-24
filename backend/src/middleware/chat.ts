import type { NextFunction, Request, Response } from "express";
import { isIpBanned } from "../repositories/chatRepository.js";

export async function chatGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userIp = req.ip;
  if (userIp && (await isIpBanned(userIp))) {
    res.status(403).json({ message: "You are banned from the chat." });
    return;
  }
  next();
}
