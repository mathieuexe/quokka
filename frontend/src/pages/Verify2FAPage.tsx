import { FormEvent, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import type { User } from "../types";

type Verify2FAResponse = {
  token: string;
  user: User;
  message: string;
};

type ResendResponse = {
  message: string;
};

export function Verify2FAPage(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!userId) return;
    
    setError(null);
    setSuccess(null);
    setPending(true);
    
    try {
      const data = await apiRequest<Verify2FAResponse>("/auth/verify-2fa", {
        method: "POST",
        body: { userId, code }
      });
      
      setSuccess(data.message);
      login(data.token, data.user);
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code invalide.");
    } finally {
      setPending(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (!userId) return;
    
    setError(null);
    setSuccess(null);
    setResending(true);
    
    try {
      const data = await apiRequest<ResendResponse>("/auth/resend-code", {
        method: "POST",
        body: { userId, type: "2fa" }
      });
      
      setSuccess(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <section className="page narrow" style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "calc(100vh - 200px)"
    }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            marginBottom: "0.75rem",
            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Double authentification
          </h1>
          <p style={{ 
            color: "#6b7280", 
            fontSize: "0.95rem",
            lineHeight: "1.6"
          }}>
            Pour sécuriser votre connexion, entrez le code de vérification envoyé à votre email
          </p>
        </div>

        <form className="card" onSubmit={onSubmit} style={{ 
          padding: "2.5rem",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
        }}>
          <div style={{ marginBottom: "2rem" }}>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              required
              autoFocus
              style={{ 
                width: "100%",
                fontSize: "2.5rem", 
                textAlign: "center", 
                letterSpacing: "1rem",
                fontFamily: "'Courier New', monospace",
                fontWeight: "600",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1.25rem",
                outline: "none",
                transition: "all 0.2s",
                backgroundColor: "#f9fafb"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#f59e0b";
                e.target.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.backgroundColor = "#f9fafb";
              }}
            />
          </div>
          
          {error && (
            <p style={{ 
              color: "#ef4444", 
              textAlign: "center",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              padding: "0.75rem",
              backgroundColor: "#fef2f2",
              borderRadius: "8px"
            }}>
              {error}
            </p>
          )}
          
          {success && (
            <p style={{ 
              color: "#10b981", 
              textAlign: "center",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              padding: "0.75rem",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px"
            }}>
              {success}
            </p>
          )}
          
          <button 
            className="btn" 
            type="submit" 
            disabled={pending || code.length !== 6}
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1rem",
              fontWeight: "600",
              borderRadius: "10px",
              marginBottom: "1rem"
            }}
          >
            {pending ? "Vérification..." : "Vérifier le code"}
          </button>

          <div style={{ 
            textAlign: "center",
            paddingTop: "1rem",
            borderTop: "1px solid #f3f4f6"
          }}>
            <p style={{ 
              color: "#9ca3af", 
              fontSize: "0.875rem",
              marginBottom: "0.5rem"
            }}>
              Vous n'avez pas reçu le code ?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "#f59e0b",
                cursor: resending ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: "600",
                textDecoration: "underline",
                opacity: resending ? 0.5 : 1
              }}
            >
              {resending ? "Envoi en cours..." : "Renvoyer le code"}
            </button>
          </div>

          <div style={{ 
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#fffbeb",
            borderRadius: "8px",
            borderLeft: "3px solid #f59e0b"
          }}>
            <p style={{ 
              margin: 0, 
              color: "#92400e", 
              fontSize: "0.85rem",
              lineHeight: "1.5"
            }}>
              <strong>Sécurité :</strong> Ne partagez jamais ce code avec qui que ce soit.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
