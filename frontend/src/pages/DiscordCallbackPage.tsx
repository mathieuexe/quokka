import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, API_URL, apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

type DiscordCallbackResponse = {
  token: string;
  user: User;
};

export function DiscordCallbackPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const retryKey = "discord-auth-retry";
    void import("./DashboardPage");
    const code = searchParams.get("code");
    const state = searchParams.get("state") ?? undefined;

    if (!code) {
      if (!sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, "1");
        window.location.href = `${API_URL}/auth/discord`;
        return;
      }
      setError("Code Discord manquant.");
      return;
    }

    let cancelled = false;
    setError(null);

    void apiRequest<DiscordCallbackResponse>("/auth/discord/callback", {
      method: "POST",
      body: { code, state }
    })
      .then((data) => {
        if (cancelled) return;
        sessionStorage.removeItem(retryKey);
        login(data.token, data.user);
        navigate("/dashboard");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          const query = new URLSearchParams();
          query.set("code", code);
          if (state) {
            query.set("state", state);
          }
          window.location.href = `${API_URL}/auth/discord/callback?${query.toString()}`;
          return;
        }
        if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
          if (!sessionStorage.getItem(retryKey)) {
            sessionStorage.setItem(retryKey, "1");
            window.location.href = `${API_URL}/auth/discord`;
            return;
          }
          setError("Code Discord expiré ou invalide. Merci de relancer la connexion.");
          return;
        }
        setError(err instanceof Error ? err.message : "Connexion Discord impossible.");
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, login]);

  return (
    <section className="page narrow">
      <div className="card" style={{ maxWidth: "520px", margin: "3rem auto", textAlign: "center" }}>
        <h1>Connexion Discord</h1>
        <img src="/images/icons/Sandy%20Loading.gif" alt="Chargement en cours" style={{ width: "120px", height: "120px" }} />
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <button
              className="btn"
              type="button"
              onClick={() => {
                sessionStorage.removeItem("discord-auth-retry");
                window.location.href = `${API_URL}/auth/discord`;
              }}
            >
              Relancer la connexion Discord
            </button>
          </>
        ) : (
          <p>Connexion en cours...</p>
        )}
      </div>
    </section>
  );
}
