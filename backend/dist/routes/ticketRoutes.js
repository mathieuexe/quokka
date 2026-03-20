import { Router } from "express";
import multer from "multer";
import { extname, join } from "path";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import { requireAuth } from "../middleware/auth.js";
import { standardLimiter } from "../middlewares/rateLimiter.middleware.js";
import { getUserTicket, getUserTickets, postTicketAttachments, postUserTicket, postUserTicketMessage } from "../controllers/ticketController.js";
export const ticketRoutes = Router();
ticketRoutes.use(requireAuth);
const uploadsDir = join(process.cwd(), "uploads", "tickets");
void fs.mkdir(uploadsDir, { recursive: true });
const allowedExtensions = new Set(["pdf", "png", "jpg", "jpeg", "mp3", "wav", "mp4", "gif", "xlsv", "csv"]);
const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
            const extension = extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${randomBytes(8).toString("hex")}${extension}`);
        }
    }),
    fileFilter: (_req, file, cb) => {
        const extension = extname(file.originalname).toLowerCase().replace(".", "");
        if (!allowedExtensions.has(extension)) {
            cb(new Error("Format de fichier invalide."));
            return;
        }
        cb(null, true);
    }
});
ticketRoutes.post("/attachments", standardLimiter, upload.array("files"), postTicketAttachments);
ticketRoutes.get("/", getUserTickets);
ticketRoutes.post("/", standardLimiter, postUserTicket);
ticketRoutes.get("/:ticketId", getUserTicket);
ticketRoutes.post("/:ticketId/messages", standardLimiter, postUserTicketMessage);
