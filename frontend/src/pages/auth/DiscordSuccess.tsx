import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function DiscordSuccess(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (token) {
      localStorage.setItem("token", token);
      timeoutId = window.setTimeout(() => {
        navigate("/");
      }, 1500);
    } else {
      setError("Connexion Discord impossible.");
      timeoutId = window.setTimeout(() => {
        navigate("/login");
      }, 2000);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [token, navigate]);

  return (
    <section className="page narrow">
      <div className="card" style={{ maxWidth: "520px", margin: "3rem auto", textAlign: "center" }}>
        <h1>Connexion Discord</h1>
        {error ? <p className="error-text">{error}</p> : <p>Connexion en cours...</p>}
      </div>
    </section>
  );
}
