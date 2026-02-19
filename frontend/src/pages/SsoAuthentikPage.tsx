import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

function parseHash(hash: string): Record<string, string> {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function SsoAuthentikPage(): JSX.Element {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => parseHash(location.hash), [location.hash]);

  useEffect(() => {
    const token = payload.token;
    const userB64 = payload.user;
    const next = payload.next && payload.next.startsWith("/") ? payload.next : "/admin";
    if (!token || !userB64) {
      setError("Données SSO manquantes.");
      return;
    }
    try {
      const userJson = atob(userB64);
      const user = JSON.parse(userJson) as User;
      login(token, user);
      navigate(next, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de finaliser la connexion SSO.");
    }
  }, [payload, login, navigate]);

  return (
    <section className="page">
      <article className="card">
        <h1>Connexion SSO</h1>
        {error ? <p className="error-text">{error}</p> : <p>Connexion en cours...</p>}
      </article>
    </section>
  );
}

