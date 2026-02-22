import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
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
    const code = searchParams.get("code");
    const state = searchParams.get("state") ?? undefined;

    if (!code) {
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
        login(data.token, data.user);
        navigate("/dashboard");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
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
        {error ? <p className="error-text">{error}</p> : <p>Connexion en cours...</p>}
      </div>
    </section>
  );
}
