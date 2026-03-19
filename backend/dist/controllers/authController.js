import { randomBytes, createHmac } from "crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { createUser, findUserByEmail, findUserById, updateLastLogin, isUserAmongFirst100, getBadgeIdBySlug, assignBadgeToUser, findUserByDiscordId, createUserFromDiscord, updateDiscordUserRecord, updateUserAvatarIfMissing, findUserByPseudo, insertUserIpEvent } from "../repositories/userRepository.js";
import { getRequestIp, resolveIpTrace } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";
import { createVerificationCode, findVerificationCode, markVerificationCodeAsUsed, markEmailAsVerified, createTwoFactorCode, findTwoFactorCode, markTwoFactorCodeAsUsed, isTwoFactorEnabled } from "../repositories/verificationRepository.js";
import { sendEmail, sendHtmlEmail, generateVerificationCode, generateVerificationEmailTemplate, generate2FAEmailTemplate, generateLoginAlertTemplate } from "../services/emailService.js";
import { generateCustomerReference } from "../utils/references.js";
import { insertAdminNotification } from "../repositories/notificationRepository.js";
import { getMaintenanceSettings } from "../repositories/systemRepository.js";
const registerSchema = z
    .object({
    pseudo: z.string().min(2).max(60),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    language: z.string().length(2).default("fr")
})
    .refine((payload) => payload.password === payload.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"]
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});
const verifyEmailSchema = z.object({
    userId: z.string().uuid(),
    code: z.string().length(6)
});
const verify2FASchema = z.object({
    userId: z.string().uuid(),
    code: z.string().length(6)
});
const resendCodeSchema = z.object({
    userId: z.string().uuid(),
    type: z.enum(["verification", "2fa"])
});
const discordCallbackSchema = z.object({
    code: z.string().min(1).optional(),
    state: z.string().optional()
});
const discordUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    global_name: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    verified: z.boolean().optional(),
    locale: z.string().optional(),
    mfa_enabled: z.boolean().optional(),
    banner: z.string().nullable().optional(),
    accent_color: z.number().nullable().optional(),
    premium_type: z.number().nullable().optional()
});
function createDiscordState(secret) {
    const timestamp = Date.now().toString();
    const nonce = randomBytes(16).toString("hex");
    const signature = createHmac("sha256", secret).update(`${timestamp}.${nonce}`).digest("hex");
    return Buffer.from(`${timestamp}.${nonce}.${signature}`).toString("base64url");
}
function verifyDiscordState(secret, state) {
    if (!state)
        return false;
    let decoded;
    try {
        decoded = Buffer.from(state, "base64url").toString("utf8");
    }
    catch {
        return false;
    }
    const [timestamp, nonce, signature] = decoded.split(".");
    if (!timestamp || !nonce || !signature)
        return false;
    const expected = createHmac("sha256", secret).update(`${timestamp}.${nonce}`).digest("hex");
    if (expected !== signature)
        return false;
    const ageMs = Date.now() - Number(timestamp);
    return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 10 * 60 * 1000;
}
function getDiscordAvatarUrl(user) {
    if (user.avatar) {
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    }
    const fallbackIndex = user.id ? (Number(user.id.slice(-1)) % 5) : 0;
    return `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;
}
function normalizePseudo(value) {
    const trimmed = value.trim().replace(/\s+/g, "");
    return trimmed.slice(0, 60) || "discord-user";
}
function getDiscordRedirectUris() {
    const candidates = [
        env.DISCORD_REDIRECT_URI,
        env.FRONTEND_URL ? `${env.FRONTEND_URL}/api/auth/discord/callback` : undefined,
        env.FRONTEND_URL ? `${env.FRONTEND_URL}/auth/discord/callback` : undefined
    ].filter((value) => Boolean(value));
    return Array.from(new Set(candidates));
}
async function generateUniquePseudo(base) {
    let candidate = normalizePseudo(base);
    const baseValue = candidate;
    let attempt = 0;
    while (await findUserByPseudo(candidate)) {
        attempt += 1;
        const suffix = randomBytes(2).toString("hex");
        candidate = `${baseValue}-${suffix}`.slice(0, 60);
        if (attempt > 8) {
            candidate = `${baseValue}-${randomBytes(4).toString("hex")}`.slice(0, 60);
            break;
        }
    }
    return candidate;
}
async function sendLoginAlertEmail(params) {
    const locationParts = [params.ipTrace.city, params.ipTrace.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : "Localisation inconnue";
    const userAgent = typeof params.req.headers["user-agent"] === "string" ? params.req.headers["user-agent"] : "Navigateur inconnu";
    const ip = params.ipTrace.ip ?? "IP inconnue";
    const provider = params.ipTrace.provider ?? "Fournisseur inconnu";
    const customerReference = generateCustomerReference(params.user.pseudo, params.user.id);
    const loginAt = new Date().toLocaleString("fr-FR");
    const template = generateLoginAlertTemplate({
        pseudo: params.user.pseudo,
        customerReference,
        loginAt,
        location,
        ip,
        userAgent,
        provider
    });
    await sendHtmlEmail({
        to: params.user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
}
export async function register(req, res) {
    const payload = registerSchema.parse(req.body);
    const existing = await findUserByEmail(payload.email);
    if (existing) {
        res.status(409).json({ message: "Email déjà utilisé." });
        return;
    }
    const passwordHash = await hashPassword(payload.password);
    const user = await createUser({
        pseudo: payload.pseudo,
        email: payload.email,
        passwordHash,
        language: payload.language
    });
    try {
        await insertAdminNotification({
            type: "user_registered",
            priority: 6,
            title: `Nouvel utilisateur inscrit: ${user.pseudo}`,
            message: `Email: ${user.email}`,
            userId: user.id
        });
    }
    catch { }
    try {
        const ipTrace = await resolveIpTrace(getRequestIp(req));
        await insertUserIpEvent({
            userId: user.id,
            eventType: "register",
            ip: ipTrace.ip,
            provider: ipTrace.provider,
            country: ipTrace.country,
            region: ipTrace.region,
            city: ipTrace.city
        });
    }
    catch { }
    try {
        const isAmongFirst100 = await isUserAmongFirst100(user.id);
        if (isAmongFirst100) {
            const badgeId = await getBadgeIdBySlug("100_premiers_utilisateurs");
            if (badgeId) {
                await assignBadgeToUser(user.id, badgeId);
            }
        }
    }
    catch (error) {
        console.error("Erreur lors de l'attribution du badge '100 premiers utilisateurs':", error);
    }
    const code = generateVerificationCode();
    await createVerificationCode(user.id, code);
    const emailTemplate = generateVerificationEmailTemplate(user.pseudo, code, user.language);
    emailTemplate.to = user.email;
    try {
        await sendEmail(emailTemplate);
        res.status(201).json({
            message: "Inscription réussie. Vérifiez votre email pour activer votre compte.",
            userId: user.id,
            requiresVerification: true
        });
    }
    catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email de vérification:", emailError);
        res.status(201).json({
            message: "Inscription réussie, mais une erreur est survenue lors de l'envoi de l'email. Veuillez demander un nouveau code.",
            userId: user.id,
            requiresVerification: true,
            emailError: true
        });
    }
}
export async function login(req, res) {
    const payload = loginSchema.parse(req.body);
    const user = await findUserByEmail(payload.email);
    if (!user) {
        res.status(401).json({ message: "Identifiants invalides." });
        return;
    }
    const isValid = await comparePassword(payload.password, user.password_hash);
    if (!isValid) {
        res.status(401).json({ message: "Identifiants invalides." });
        return;
    }
    const twoFactorActive = await isTwoFactorEnabled(user.id);
    if (twoFactorActive) {
        const code = generateVerificationCode();
        await createTwoFactorCode(user.id, code);
        const emailTemplate = generate2FAEmailTemplate(user.pseudo, code, user.language);
        emailTemplate.to = user.email;
        try {
            await sendEmail(emailTemplate);
            res.json({
                message: "Code de vérification envoyé à votre email.",
                userId: user.id,
                requires2FA: true
            });
        }
        catch (emailError) {
            console.error("Erreur lors de l'envoi de l'email 2FA:", emailError);
            res.status(500).json({
                message: "Erreur lors de l'envoi du code de vérification. Veuillez réessayer.",
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }
    }
    else {
        await updateLastLogin(user.id);
        try {
            const ipTrace = await resolveIpTrace(getRequestIp(req));
            await insertUserIpEvent({
                userId: user.id,
                eventType: "login",
                ip: ipTrace.ip,
                provider: ipTrace.provider,
                country: ipTrace.country,
                region: ipTrace.region,
                city: ipTrace.city
            });
            await sendLoginAlertEmail({ user, req, ipTrace });
        }
        catch { }
        const token = signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role
        });
        res.json({
            token,
            user: {
                id: user.id,
                pseudo: user.pseudo,
                email: user.email,
                avatar_url: user.avatar_url,
                email_verified: user.email_verified,
                two_factor_enabled: user.two_factor_enabled,
                role: user.role,
                balance_cents: user.balance_cents,
                last_balance_update: user.last_balance_update
            }
        });
    }
}
export async function verifyEmail(req, res) {
    const payload = verifyEmailSchema.parse(req.body);
    const verificationCode = await findVerificationCode(payload.userId, payload.code);
    if (!verificationCode) {
        res.status(400).json({ message: "Code invalide ou expiré." });
        return;
    }
    await markVerificationCodeAsUsed(verificationCode.id);
    await markEmailAsVerified(payload.userId);
    const user = await findUserByEmail((await findUserById(payload.userId)).email);
    if (!user) {
        res.status(404).json({ message: "Utilisateur introuvable." });
        return;
    }
    const token = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role
    });
    res.json({
        message: "Email vérifié avec succès.",
        token,
        user: {
            id: user.id,
            pseudo: user.pseudo,
            email: user.email,
            avatar_url: user.avatar_url,
            email_verified: true,
            two_factor_enabled: user.two_factor_enabled,
            role: user.role,
            balance_cents: user.balance_cents,
            last_balance_update: user.last_balance_update
        }
    });
}
export async function verify2FA(req, res) {
    const payload = verify2FASchema.parse(req.body);
    const twoFactorCode = await findTwoFactorCode(payload.userId, payload.code);
    if (!twoFactorCode) {
        res.status(400).json({ message: "Code invalide ou expiré." });
        return;
    }
    await markTwoFactorCodeAsUsed(twoFactorCode.id);
    const user = await findUserByEmail((await findUserById(payload.userId)).email);
    if (!user) {
        res.status(404).json({ message: "Utilisateur introuvable." });
        return;
    }
    await updateLastLogin(user.id);
    try {
        const ipTrace = await resolveIpTrace(getRequestIp(req));
        await insertUserIpEvent({
            userId: user.id,
            eventType: "login",
            ip: ipTrace.ip,
            provider: ipTrace.provider,
            country: ipTrace.country,
            region: ipTrace.region,
            city: ipTrace.city
        });
        await sendLoginAlertEmail({ user, req, ipTrace, language: user.language });
    }
    catch { }
    const token = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role
    });
    res.json({
        message: "Authentification réussie.",
        token,
        user: {
            id: user.id,
            pseudo: user.pseudo,
            email: user.email,
            avatar_url: user.avatar_url,
            email_verified: user.email_verified,
            two_factor_enabled: user.two_factor_enabled,
            role: user.role,
            balance_cents: user.balance_cents,
            last_balance_update: user.last_balance_update
        }
    });
}
export async function resendCode(req, res) {
    const payload = resendCodeSchema.parse(req.body);
    const user = await findUserById(payload.userId);
    if (!user) {
        res.status(404).json({ message: "Utilisateur introuvable." });
        return;
    }
    const code = generateVerificationCode();
    try {
        if (payload.type === "verification") {
            await createVerificationCode(user.id, code);
            const emailTemplate = generateVerificationEmailTemplate(user.pseudo, code, user.language);
            emailTemplate.to = user.email;
            await sendEmail(emailTemplate);
            res.json({ message: "Code de vérification renvoyé." });
        }
        else {
            await createTwoFactorCode(user.id, code);
            const emailTemplate = generate2FAEmailTemplate(user.pseudo, code, user.language);
            emailTemplate.to = user.email;
            await sendEmail(emailTemplate);
            res.json({ message: "Code 2FA renvoyé." });
        }
    }
    catch (error) {
        console.error(`Erreur lors du renvoi du code ${payload.type}:`, error);
        res.status(500).json({
            message: "Erreur lors de l'envoi de l'email. Veuillez réessayer.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
export async function startDiscordLogin(_req, res) {
    const maintenance = await getMaintenanceSettings();
    if (maintenance.discord_auth_enabled) {
        res.status(503).json({ message: maintenance.discord_auth_message || "Connexion Discord en maintenance." });
        return;
    }
    const redirectUris = getDiscordRedirectUris();
    if (!env.DISCORD_CLIENT_ID || redirectUris.length === 0) {
        res.status(500).json({ message: "Configuration Discord manquante." });
        return;
    }
    const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        redirect_uri: redirectUris[0],
        response_type: "code",
        scope: "identify email"
    });
    if (env.DISCORD_SESSION_SECRET) {
        params.set("state", createDiscordState(env.DISCORD_SESSION_SECRET));
    }
    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
export async function handleDiscordCallback(req, res) {
    const maintenance = await getMaintenanceSettings();
    if (maintenance.discord_auth_enabled) {
        res.status(503).json({ message: maintenance.discord_auth_message || "Connexion Discord en maintenance." });
        return;
    }
    const payload = discordCallbackSchema.parse({
        code: typeof req.body?.code === "string"
            ? req.body.code
            : typeof req.query.code === "string"
                ? req.query.code
                : undefined,
        state: typeof req.body?.state === "string"
            ? req.body.state
            : typeof req.query.state === "string"
                ? req.query.state
                : undefined
    });
    if (!payload.code) {
        if (req.method === "GET") {
            res.redirect("/api/auth/discord");
            return;
        }
        res.status(400).json({ message: "Code Discord manquant." });
        return;
    }
    if (env.DISCORD_SESSION_SECRET && !verifyDiscordState(env.DISCORD_SESSION_SECRET, payload.state)) {
        res.status(400).json({ message: "Session Discord expirée ou invalide." });
        return;
    }
    const redirectUris = getDiscordRedirectUris();
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || redirectUris.length === 0) {
        res.status(500).json({ message: "Configuration Discord manquante." });
        return;
    }
    let tokenData = null;
    let lastErrorText = null;
    for (const redirectUri of redirectUris) {
        const tokenParams = new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code: payload.code,
            redirect_uri: redirectUri
        });
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: tokenParams.toString()
        });
        if (tokenResponse.ok) {
            tokenData = (await tokenResponse.json());
            break;
        }
        lastErrorText = await tokenResponse.text();
    }
    if (!tokenData) {
        res.status(401).json({ message: "Échec de la connexion Discord.", error: lastErrorText ?? undefined });
        return;
    }
    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!userResponse.ok) {
        const errorText = await userResponse.text();
        res.status(401).json({ message: "Impossible de récupérer le profil Discord.", error: errorText });
        return;
    }
    const discordUserRaw = (await userResponse.json());
    const discordUser = discordUserSchema.parse(discordUserRaw);
    const discordAvatarUrl = getDiscordAvatarUrl(discordUser);
    let user = await findUserByDiscordId(discordUser.id);
    if (!user) {
        const pseudoBase = discordUser.global_name ?? discordUser.username;
        const pseudo = await generateUniquePseudo(pseudoBase);
        const email = discordUser.email ?? `discord-${discordUser.id}@users.discord`;
        const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
        user = await createUserFromDiscord({
            pseudo,
            email,
            passwordHash,
            avatarUrl: discordAvatarUrl,
            emailVerified: discordUser.verified ?? Boolean(discordUser.email),
            discordId: discordUser.id,
            discordUsername: discordUser.username,
            discordAvatarUrl,
            discordEmail: discordUser.email ?? null,
            discordLocale: discordUser.locale ?? null,
            discordProfile: discordUserRaw
        });
        void (async () => {
            try {
                await insertAdminNotification({
                    type: "user_registered",
                    priority: 6,
                    title: `Nouvel utilisateur inscrit: ${user.pseudo}`,
                    message: `Email: ${user.email}`,
                    userId: user.id
                });
            }
            catch { }
            try {
                const isAmongFirst100 = await isUserAmongFirst100(user.id);
                if (isAmongFirst100) {
                    const badgeId = await getBadgeIdBySlug("100_premiers_utilisateurs");
                    if (badgeId) {
                        await assignBadgeToUser(user.id, badgeId);
                    }
                }
            }
            catch (error) {
                console.error("Erreur lors de l'attribution du badge '100 premiers utilisateurs':", error);
            }
        })();
    }
    else {
        void Promise.all([
            updateDiscordUserRecord({
                userId: user.id,
                discordId: discordUser.id,
                discordUsername: discordUser.username,
                discordAvatarUrl,
                discordEmail: discordUser.email ?? null,
                discordLocale: discordUser.locale ?? null,
                discordProfile: discordUserRaw
            }),
            updateUserAvatarIfMissing(user.id, discordAvatarUrl)
        ]);
    }
    void updateLastLogin(user.id);
    void (async () => {
        try {
            const ipTrace = await resolveIpTrace(getRequestIp(req));
            await insertUserIpEvent({
                userId: user.id,
                eventType: "login",
                ip: ipTrace.ip,
                provider: ipTrace.provider,
                country: ipTrace.country,
                region: ipTrace.region,
                city: ipTrace.city
            });
            await sendLoginAlertEmail({ user, req, ipTrace, language: user.language });
        }
        catch { }
    })();
    const token = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role
    });
    if (req.method === "POST") {
        res.json({ token, user });
        return;
    }
    const frontendUrl = env.FRONTEND_URL ?? "https://quokka.gg";
    res.redirect(`${frontendUrl}/auth/discord/success?token=${token}`);
}
