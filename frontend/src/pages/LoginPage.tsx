import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { API_URL, apiRequest } from "../lib/api";
import type { User } from "../types";

type AuthResponse = {
  token?: string;
  user?: User;
  message?: string;
  userId?: string;
  requires2FA?: boolean;
};

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const discordLoginUrl = `${API_URL}/auth/discord`;

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      
      if (data.requires2FA && data.userId) {
        // Rediriger vers la page de vérification 2FA
        navigate(`/verify-2fa?userId=${data.userId}`);
      } else if (data.token && data.user) {
        // Connexion directe (si 2FA désactivé)
        login(data.token, data.user);
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.invalidCredentials"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="page auth-page">
      <div className="auth-shell">
        <article className="auth-panel">
          <span className="auth-kicker">Quokka</span>
          <h1>{t("auth.login")}</h1>
          <p className="auth-subtitle">{t("auth.loginSubtitle")}</p>
          <ul className="auth-feature-list">
            <li>{t("auth.loginFeature1")}</li>
            <li>{t("auth.loginFeature2")}</li>
            <li>{t("auth.loginFeature3")}</li>
          </ul>
        </article>

        <form className="card form auth-form-card" onSubmit={onSubmit}>
          <h2>{t("auth.loginButton")}</h2>
          <a className="btn auth-discord-btn" href={discordLoginUrl}>
            <svg className="auth-discord-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19.54 4.27c-1.35-.62-2.8-1.07-4.32-1.27a16.45 16.45 0 0 0-.63 1.31 15.29 15.29 0 0 0-4.18 0A16.48 16.48 0 0 0 9.78 3c-1.52.2-2.98.65-4.33 1.27C2.79 7.57 2.27 10.8 2.5 13.97c1.73 1.27 3.4 2.04 5.05 2.54.4-.54.76-1.12 1.07-1.73-.59-.22-1.15-.5-1.68-.83.14-.1.27-.2.4-.3 3.23 1.51 6.72 1.51 9.93 0 .13.11.26.2.4.3-.53.33-1.09.6-1.68.83.31.61.67 1.19 1.07 1.73 1.66-.5 3.33-1.27 5.06-2.54.27-3.66-.45-6.86-2.2-9.7ZM8.78 12.94c-.69 0-1.25-.64-1.25-1.43 0-.8.55-1.44 1.25-1.44.7 0 1.26.65 1.25 1.44 0 .79-.55 1.43-1.25 1.43Zm6.44 0c-.69 0-1.25-.64-1.25-1.43 0-.8.55-1.44 1.25-1.44.7 0 1.26.65 1.25 1.44 0 .79-.55 1.43-1.25 1.43Z"
              />
            </svg>
            Se connecter via Discord
          </a>
          <label>
            {t("auth.email")}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            {t("auth.password")}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn auth-submit-btn" type="submit" disabled={pending}>
            {pending ? t("common.loading") : t("auth.loginButton")}
          </button>
          <p className="auth-switch-link">
            {t("auth.noAccount")} <Link to="/register">{t("auth.register")}</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
