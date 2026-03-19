import { Resend } from "resend";
import { env } from "../config/env.js";
let resendClient = null;
function getResendClient() {
    if (!env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }
    if (!resendClient) {
        resendClient = new Resend(env.RESEND_API_KEY);
    }
    return resendClient;
}
export async function sendEmail(template) {
    try {
        console.log(`Attempting to send email to: ${template.to}`);
        console.log(`Subject: ${template.subject}`);
        try {
            const result = await getResendClient().emails.send({
                from: "Quokka <noreply@quokka.gg>",
                to: template.to,
                subject: template.subject,
                text: template.text
            });
            console.log(`Email sent successfully with quokka.gg domain. ID: ${result.data?.id}`);
        }
        catch (domainError) {
            console.error(`Error with quokka.gg domain:`, domainError.message);
            if (domainError?.message?.includes('domain') || domainError?.statusCode === 403 || domainError?.status === 403) {
                console.warn("Domain quokka.gg not verified, falling back to resend.dev");
                try {
                    const fallbackResult = await getResendClient().emails.send({
                        from: "Quokka <onboarding@resend.dev>",
                        to: template.to,
                        subject: template.subject,
                        text: template.text
                    });
                    console.log(`Email sent successfully with resend.dev domain. ID: ${fallbackResult.data?.id}`);
                }
                catch (fallbackError) {
                    console.error(`Error with resend.dev domain:`, fallbackError.message);
                    throw fallbackError;
                }
            }
            else {
                throw domainError;
            }
        }
    }
    catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error.message || error);
        throw new Error(`Impossible d'envoyer l'email: ${error.message || 'Erreur inconnue'}`);
    }
}
export async function sendHtmlEmail(template) {
    try {
        console.log(`Attempting to send HTML email to: ${template.to}`);
        console.log(`Subject: ${template.subject}`);
        const payload = {
            from: "Quokka <noreply@quokka.gg>",
            to: template.to,
            subject: template.subject,
            html: template.html,
            text: template.text ?? ""
        };
        try {
            const result = await getResendClient().emails.send(payload);
            console.log(`HTML email sent successfully with quokka.gg domain. ID: ${result.data?.id}`);
        }
        catch (domainError) {
            console.error(`Error with quokka.gg domain:`, domainError.message);
            if (domainError?.message?.includes('domain') || domainError?.statusCode === 403 || domainError?.status === 403) {
                console.warn("Domain quokka.gg not verified, falling back to resend.dev");
                const fallbackPayload = { ...payload, from: "Quokka <onboarding@resend.dev>" };
                const fallbackResult = await getResendClient().emails.send(fallbackPayload);
                console.log(`HTML email sent successfully with resend.dev domain. ID: ${fallbackResult.data?.id}`);
            }
            else {
                throw domainError;
            }
        }
    }
    catch (error) {
        console.error("Erreur lors de l'envoi de l'email HTML:", error.message || error);
        throw new Error(`Impossible d'envoyer l'email HTML: ${error.message || 'Erreur inconnue'}`);
    }
}
export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const translations = {
    fr: {
        subject: "Vérifiez votre adresse email - Quokka",
        title: "VÉRIFICATION EMAIL",
        greeting: "Bonjour",
        message: "Voici votre code de vérification :",
        expiryNote: "Ce code expire dans 10 minutes.",
        footer: "© ${year} Quokka - Tous droits réservés"
    },
    en: {
        subject: "Verify your email address - Quokka",
        title: "EMAIL VERIFICATION",
        greeting: "Hello",
        message: "Here is your verification code:",
        expiryNote: "This code expires in 10 minutes.",
        footer: "© ${year} Quokka - All rights reserved"
    },
    es: {
        subject: "Verifica tu dirección de correo - Quokka",
        title: "VERIFICACIÓN DE CORREO",
        greeting: "Hola",
        message: "Aquí está tu código de verificación:",
        expiryNote: "Este código caduca en 10 minutos.",
        footer: "© ${year} Quokka - Todos los derechos reservados"
    },
    de: {
        subject: "Bestätigen Sie Ihre E-Mail-Adresse - Quokka",
        title: "E-MAIL-BESTÄTIGUNG",
        greeting: "Hallo",
        message: "Hier ist Ihr Bestätigungscode:",
        expiryNote: "Dieser Code läuft in 10 Minuten ab.",
        footer: "© ${year} Quokka - Alle Rechte vorbehalten"
    },
    it: {
        subject: "Verifica il tuo indirizzo email - Quokka",
        title: "VERIFICA EMAIL",
        greeting: "Ciao",
        message: "Ecco il tuo codice di verifica:",
        expiryNote: "Questo codice scade tra 10 minuti.",
        footer: "© ${year} Quokka - Tutti i diritti riservati"
    },
    pt: {
        subject: "Verifique seu endereço de email - Quokka",
        title: "VERIFICAÇÃO DE EMAIL",
        greeting: "Olá",
        message: "Aqui está seu código de verificação:",
        expiryNote: "Este código expira em 10 minutos.",
        footer: "© ${year} Quokka - Todos os direitos reservados"
    },
    zh: {
        subject: "验证您的电子邮件地址 - Quokka",
        title: "电子邮件验证",
        greeting: "您好",
        message: "这是您的验证码：",
        expiryNote: "此代码将在10分钟后过期。",
        footer: "© ${year} Quokka - 保留所有权利"
    },
    ja: {
        subject: "メールアドレスを認証 - Quokka",
        title: "メール認証",
        greeting: "こんにちは",
        message: "認証コードは以下の通りです：",
        expiryNote: "このコードは10分後に期限切れになります。",
        footer: "© ${year} Quokka - 無断複写・転載を禁じます"
    },
    hi: {
        subject: "अपना ईमेल पता सत्यापित करें - Quokka",
        title: "ईमेल सत्यापन",
        greeting: "नमस्ते",
        message: "यहाँ आपका सत्यापन कोड है:",
        expiryNote: "यह कोड 10 मिनट में समाप्त हो जाएगा।",
        footer: "© ${year} Quokka - सर्वाधिकार सुरक्षित"
    },
    ru: {
        subject: "Подтвердите ваш email адрес - Quokka",
        title: "ПОДТВЕРЖДЕНИЕ EMAIL",
        greeting: "Здравствуйте",
        message: "Вот ваш код подтверждения:",
        expiryNote: "Этот код истекает через 10 минут.",
        footer: "© ${year} Quokka - Все права защищены"
    },
    uk: {
        subject: "Підтвердіть вашу email адресу - Quokka",
        title: "ПІДТВЕРДЖЕННЯ EMAIL",
        greeting: "Вітаємо",
        message: "Ось ваш код підтвердження:",
        expiryNote: "Цей код закінчується через 10 хвилин.",
        footer: "© ${year} Quokka - Всі права захищені"
    }
};
const translations2FA = {
    fr: {
        subject: "Code de connexion - Quokka",
        title: "CODE DE CONNEXION",
        greeting: "Bonjour",
        message: "Voici votre code de vérification :",
        expiryNote: "Ce code expire dans 10 minutes.",
        footer: "© ${year} Quokka - Tous droits réservés"
    },
    en: {
        subject: "Login code - Quokka",
        title: "LOGIN CODE",
        greeting: "Hello",
        message: "Here is your verification code:",
        expiryNote: "This code expires in 10 minutes.",
        footer: "© ${year} Quokka - All rights reserved"
    },
    es: {
        subject: "Código de inicio de sesión - Quokka",
        title: "CÓDIGO DE INICIO DE SESIÓN",
        greeting: "Hola",
        message: "Aquí está tu código de verificación:",
        expiryNote: "Este código caduca en 10 minutos.",
        footer: "© ${year} Quokka - Todos los derechos reservados"
    },
    de: {
        subject: "Anmeldecode - Quokka",
        title: "ANMELDECODE",
        greeting: "Hallo",
        message: "Hier ist Ihr Bestätigungscode:",
        expiryNote: "Dieser Code läuft in 10 Minuten ab.",
        footer: "© ${year} Quokka - Alle Rechte vorbehalten"
    },
    it: {
        subject: "Codice di accesso - Quokka",
        title: "CODICE DI ACCESSO",
        greeting: "Ciao",
        message: "Ecco il tuo codice di verifica:",
        expiryNote: "Questo codice scade tra 10 minuti.",
        footer: "© ${year} Quokka - Tutti i diritti riservati"
    },
    pt: {
        subject: "Código de login - Quokka",
        title: "CÓDIGO DE LOGIN",
        greeting: "Olá",
        message: "Aqui está seu código de verificação:",
        expiryNote: "Este código expira em 10 minutos.",
        footer: "© ${year} Quokka - Todos os direitos reservados"
    },
    zh: {
        subject: "登录代码 - Quokka",
        title: "登录代码",
        greeting: "您好",
        message: "这是您的验证码：",
        expiryNote: "此代码将在10分钟后过期。",
        footer: "© ${year} Quokka - 保留所有权利"
    },
    ja: {
        subject: "ログインコード - Quokka",
        title: "ログインコード",
        greeting: "こんにちは",
        message: "認証コードは以下の通りです：",
        expiryNote: "このコードは10分後に期限切れになります。",
        footer: "© ${year} Quokka - 無断複写・転載を禁じます"
    },
    hi: {
        subject: "लॉगिन कोड - Quokka",
        title: "लॉगिन कोड",
        greeting: "नमस्ते",
        message: "यहाँ आपका सत्यापन कोड है:",
        expiryNote: "यह कोड 10 मिनट में समाप्त हो जाएगा।",
        footer: "© ${year} Quokka - सर्वाधिकार सुरक्षित"
    },
    ru: {
        subject: "Код входа - Quokka",
        title: "КОД ВХОДА",
        greeting: "Здравствуйте",
        message: "Вот ваш код подтверждения:",
        expiryNote: "Этот код истекает через 10 минут.",
        footer: "© ${year} Quokka - Все права защищены"
    },
    uk: {
        subject: "Код входу - Quokka",
        title: "КОД ВХОДУ",
        greeting: "Вітаємо",
        message: "Ось ваш код підтвердження:",
        expiryNote: "Цей код закінчується через 10 хвилин.",
        footer: "© ${year} Quokka - Всі права захищені"
    }
};
const security2FA = {
    fr: "SÉCURITÉ : Ne partagez jamais ce code. Si vous n'êtes pas à l'origine de cette connexion, changez immédiatement votre mot de passe.",
    en: "SECURITY: Never share this code. If you didn't initiate this login, change your password immediately.",
    es: "SEGURIDAD: Nunca compartas este código. Si no iniciaste esta conexión, cambia tu contraseña inmediatamente.",
    de: "SICHERHEIT: Teilen Sie diesen Code niemals. Wenn Sie diese Anmeldung nicht initiiert haben, ändern Sie sofort Ihr Passwort.",
    it: "SICUREZZA: Non condividere mai questo codice. Se non hai avviato questo accesso, cambia immediatamente la password.",
    pt: "SEGURANÇA: Nunca compartilhe este código. Se você não iniciou este login, mude sua senha imediatamente.",
    zh: "安全提示：切勿分享此代码。如果您未发起此登录，请立即更改密码。",
    ja: "セキュリティ：このコードを共有しないでください。このログインを開始していない場合は、すぐにパスワードを変更してください。",
    hi: "सुरक्षा: इस कोड को कभी साझा न करें। यदि आपने इस लॉगिन को शुरू नहीं किया है, तो तुरंत अपना पासवर्ड बदलें।",
    ru: "БЕЗОПАСНОСТЬ: Никогда не делитесь этим кодом. Если вы не инициировали этот вход, немедленно смените пароль.",
    uk: "БЕЗПЕКА: Ніколи не діліться цим кодом. Якщо ви не ініціювали цей вхід, негайно змініть пароль."
};
function getTranslation(lang) {
    return translations[lang] || translations.fr;
}
function get2FATranslation(lang) {
    return translations2FA[lang] || translations2FA.fr;
}
function get2FASecurityMessage(lang) {
    return security2FA[lang] || security2FA.fr;
}
export function generateVerificationEmailTemplate(pseudo, code, language = "fr") {
    const t = getTranslation(language);
    const year = new Date().getFullYear();
    return {
        to: "",
        subject: t.subject,
        text: `
═══════════════════════════════════════════════════
${t.title}
═══════════════════════════════════════════════════

${t.greeting} ${pseudo},

${t.message}

    ${code}

${t.expiryNote}

---

${t.footer.replace("${year}", year.toString())}
    `.trim()
    };
}
export function generate2FAEmailTemplate(pseudo, code, language = "fr") {
    const t = get2FATranslation(language);
    const securityMsg = get2FASecurityMessage(language);
    const year = new Date().getFullYear();
    return {
        to: "",
        subject: t.subject,
        text: `
═══════════════════════════════════════════════════
${t.title}
═══════════════════════════════════════════════════

${t.greeting} ${pseudo},

${t.message}

    ${code}

${t.expiryNote}

⚠️  ${securityMsg}

---

${t.footer.replace("${year}", year.toString())}
    `.trim()
    };
}
function escapeHtml(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function formatHtmlContent(content) {
    const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    if (blocks.length === 0)
        return "";
    return blocks
        .map((block) => `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1F2937;">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
        .join("");
}
export function generateAdminMailTemplate(subject, content) {
    const year = new Date().getFullYear();
    const baseUrl = env.FRONTEND_URL.replace(/\/$/, "");
    const logoUrl = `${baseUrl}/images/logo/logorond.png`;
    const htmlContent = formatHtmlContent(content);
    const safeSubject = escapeHtml(subject);
    const html = `
    <div style="background:#F4F6FB;padding:32px 12px;font-family:'Segoe UI',Arial,sans-serif;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:18px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="padding:28px 32px 16px 32px;text-align:center;">
            <img src="${logoUrl}" alt="Quokka" width="72" height="72" style="display:block;margin:0 auto 12px auto;border-radius:50%;" />
            <h1 style="margin:0;font-size:24px;letter-spacing:0.02em;color:#0F172A;">Quokka</h1>
            <p style="margin:6px 0 0 0;color:#6B7280;font-size:14px;">${safeSubject}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 10px 32px;">
            ${htmlContent}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 32px 28px 32px;text-align:center;color:#9CA3AF;font-size:12px;">
            © ${year} Quokka - Tous droits réservés
          </td>
        </tr>
      </table>
    </div>
  `.trim();
    return { subject, html, text: content };
}
const loginTranslations = {
    fr: {
        subject: "Alerte de connexion à votre compte Quokka",
        greeting: "Bonjour",
        detected: "Une connexion à votre compte vient d'être détectée.",
        labels: {
            datetime: "Date et heure",
            location: "Localisation",
            ip: "Adresse IP",
            browser: "Navigateur",
            provider: "Fournisseur",
            userRef: "Référence utilisateur"
        },
        security: "Si vous n'êtes pas à l'origine de cette connexion, contactez-nous immédiatement.",
        footer: "© ${year} Quokka - Tous droits réservés"
    },
    en: {
        subject: "Login alert to your Quokka account",
        greeting: "Hello",
        detected: "A login to your account has just been detected.",
        labels: {
            datetime: "Date and time",
            location: "Location",
            ip: "IP address",
            browser: "Browser",
            provider: "Provider",
            userRef: "User reference"
        },
        security: "If you did not initiate this login, please contact us immediately.",
        footer: "© ${year} Quokka - All rights reserved"
    },
    es: {
        subject: "Alerta de inicio de sesión en tu cuenta de Quokka",
        greeting: "Hola",
        detected: "Se ha detectado un inicio de sesión en tu cuenta.",
        labels: {
            datetime: "Fecha y hora",
            location: "Ubicación",
            ip: "Dirección IP",
            browser: "Navegador",
            provider: "Proveedor",
            userRef: "Referencia de usuario"
        },
        security: "Si no has iniciado tú este acceso, contáctanos de inmediato.",
        footer: "© ${year} Quokka - Todos los derechos reservados"
    },
    de: {
        subject: "Anmeldewarnung für Ihr Quokka-Konto",
        greeting: "Hallo",
        detected: "Es wurde soeben eine Anmeldung bei Ihrem Konto erkannt.",
        labels: {
            datetime: "Datum und Uhrzeit",
            location: "Standort",
            ip: "IP-Adresse",
            browser: "Browser",
            provider: "Anbieter",
            userRef: "Benutzerreferenz"
        },
        security: "Wenn Sie diese Anmeldung nicht veranlasst haben, kontaktieren Sie uns umgehend.",
        footer: "© ${year} Quokka - Alle Rechte vorbehalten"
    },
    it: {
        subject: "Avviso di accesso al tuo account Quokka",
        greeting: "Ciao",
        detected: "È stato rilevato un accesso al tuo account.",
        labels: {
            datetime: "Data e ora",
            location: "Localizzazione",
            ip: "Indirizzo IP",
            browser: "Browser",
            provider: "Provider",
            userRef: "Riferimento utente"
        },
        security: "Se non sei stato tu ad avviare questo accesso, contattaci immediatamente.",
        footer: "© ${year} Quokka - Tutti i diritti riservati"
    },
    pt: {
        subject: "Alerta de login na sua conta Quokka",
        greeting: "Olá",
        detected: "Um login na sua conta acaba de ser detectado.",
        labels: {
            datetime: "Data e hora",
            location: "Localização",
            ip: "Endereço IP",
            browser: "Navegador",
            provider: "Provedor",
            userRef: "Referência do usuário"
        },
        security: "Se você não iniciou este login, entre em contato conosco imediatamente.",
        footer: "© ${year} Quokka - Todos os direitos reservados"
    },
    zh: {
        subject: "您的 Quokka 帐户登录提醒",
        greeting: "您好",
        detected: "我们检测到您的帐户刚刚登录。",
        labels: {
            datetime: "日期和时间",
            location: "位置",
            ip: "IP 地址",
            browser: "浏览器",
            provider: "供应商",
            userRef: "用户参考"
        },
        security: "如果这不是您本人操作，请立即与我们联系。",
        footer: "© ${year} Quokka - 保留所有权利"
    },
    ja: {
        subject: "Quokkaアカウントのログイン通知",
        greeting: "こんにちは",
        detected: "あなたのアカウントへのログインが検出されました。",
        labels: {
            datetime: "日時",
            location: "場所",
            ip: "IPアドレス",
            browser: "ブラウザ",
            provider: "プロバイダ",
            userRef: "ユーザー参照"
        },
        security: "このログインに心当たりがない場合は、至急ご連絡ください。",
        footer: "© ${year} Quokka - 無断複製・転載を禁じます"
    },
    hi: {
        subject: "आपके Quokka खाते में लॉगिन अलर्ट",
        greeting: "नमस्ते",
        detected: "आपके खाते में अभी लॉगिन पाया गया है।",
        labels: {
            datetime: "तारीख और समय",
            location: "स्थान",
            ip: "आईपी पता",
            browser: "ब्राउज़र",
            provider: "प्रदाता",
            userRef: "उपयोगकर्ता संदर्भ"
        },
        security: "यदि यह लॉगिन आपने आरंभ नहीं किया है, तो तुरंत हमसे संपर्क करें।",
        footer: "© ${year} Quokka - सर्वाधिकार सुरक्षित"
    },
    ru: {
        subject: "Предупреждение о входе в ваш аккаунт Quokka",
        greeting: "Здравствуйте",
        detected: "Только что зафиксирован вход в ваш аккаунт.",
        labels: {
            datetime: "Дата и время",
            location: "Местоположение",
            ip: "IP-адрес",
            browser: "Браузер",
            provider: "Провайдер",
            userRef: "Ссылка пользователя"
        },
        security: "Если это были не вы, немедленно свяжитесь с нами.",
        footer: "© ${year} Quokka - Все права защищены"
    },
    uk: {
        subject: "Попередження про вхід до вашого облікового запису Quokka",
        greeting: "Вітаємо",
        detected: "Щойно зафіксовано вхід до вашого облікового запису.",
        labels: {
            datetime: "Дата і час",
            location: "Місцезнаходження",
            ip: "IP-адреса",
            browser: "Браузер",
            provider: "Провайдер",
            userRef: "Посилання користувача"
        },
        security: "Якщо це були не ви, негайно зв'яжіться з нами.",
        footer: "© ${year} Quokka - Усі права захищено"
    }
};
function getLoginTranslation(lang) {
    return loginTranslations[lang] || loginTranslations.fr;
}
export function generateLoginAlertTemplate(params) {
    const year = new Date().getFullYear();
    const baseUrl = env.FRONTEND_URL.replace(/\/$/, "");
    const logoUrl = `${baseUrl}/images/logo/logorond.png`;
    const t = getLoginTranslation(params.language ?? "fr");
    const subject = t.subject;
    const html = `
    <div style="background:#F4F6FB;padding:32px 12px;font-family:'Segoe UI',Arial,sans-serif;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:18px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="padding:28px 32px 16px 32px;text-align:center;">
            <img src="${logoUrl}" alt="Quokka" width="72" height="72" style="display:block;margin:0 auto 12px auto;border-radius:50%;" />
            <h1 style="margin:0;font-size:24px;letter-spacing:0.02em;color:#0F172A;">Quokka</h1>
            <p style="margin:6px 0 0 0;color:#6B7280;font-size:14px;">${escapeHtml(subject)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 10px 32px;">
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1F2937;">${escapeHtml(t.greeting)} ${escapeHtml(params.pseudo)},</p>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1F2937;">${escapeHtml(t.detected)}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:12px 16px;background:#F9FAFB;font-size:13px;color:#6B7280;">${escapeHtml(t.labels.datetime)}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${escapeHtml(params.loginAt)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#F9FAFB;font-size:13px;color:#6B7280;">${escapeHtml(t.labels.location)}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${escapeHtml(params.location)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#F9FAFB;font-size:13px;color:#6B7280;">${escapeHtml(t.labels.ip)}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${escapeHtml(params.ip)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#F9FAFB;font-size:13px;color:#6B7280;">${escapeHtml(t.labels.browser)}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${escapeHtml(params.userAgent)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#F9FAFB;font-size:13px;color:#6B7280;">${escapeHtml(t.labels.provider)}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${escapeHtml(params.provider)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#F9FAFB;font-size:13px;color:#6B7280;">${escapeHtml(t.labels.userRef)}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${escapeHtml(params.customerReference)}</td>
              </tr>
            </table>
            <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#DC2626;">${escapeHtml(t.security)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 32px 28px 32px;text-align:center;color:#9CA3AF;font-size:12px;">
            ${escapeHtml(t.footer.replace("${year}", String(year)))}
          </td>
        </tr>
      </table>
    </div>
  `.trim();
    const text = `
${t.subject}

${t.greeting} ${params.pseudo},

${t.detected}

${t.labels.datetime}: ${params.loginAt}
${t.labels.location}: ${params.location}
${t.labels.ip}: ${params.ip}
${t.labels.browser}: ${params.userAgent}
${t.labels.provider}: ${params.provider}
${t.labels.userRef}: ${params.customerReference}

${t.security}

${t.footer.replace("${year}", String(year))}
  `.trim();
    return { subject, html, text };
}
