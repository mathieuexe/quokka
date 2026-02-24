import { isIpBanned } from "../repositories/chatRepository.js";
export async function chatGuard(req, res, next) {
    const userIp = req.ip;
    if (userIp && (await isIpBanned(userIp))) {
        res.status(403).json({ message: "You are banned from the chat." });
        return;
    }
    next();
}
