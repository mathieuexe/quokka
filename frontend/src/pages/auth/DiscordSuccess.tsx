import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";
import type { User } from "../../types";

type DashboardResponse = {
  user: User;
};

export function DiscordSuccess(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (!token) {
      setError("Connexion Discord impossible.");
      timeoutId = window.setTimeout(() => {
        navigate("/login");
      }, 2000);
      return () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    let cancelled = false;
    setError(null);

    void apiRequest<DashboardResponse>("/dashboard", { token })
      .then((data) => {
        if (cancelled) return;
        login(token, data.user);
        timeoutId = window.setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Connexion Discord impossible.");
        timeoutId = window.setTimeout(() => {
          navigate("/login");
        }, 2000);
      });

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [token, navigate, login]);

  return (
    <section className="page narrow">
      <div className="card" style={{ maxWidth: "520px", margin: "3rem auto", textAlign: "center" }}>
        <h1>Connexion Discord</h1>
        {error ? <p className="error-text">{error}</p> : <p>Connexion en cours...</p>}
      </div>
    </section>
  );
}
