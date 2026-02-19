import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import "./EmailVerificationBanner.css";

export function EmailVerificationBanner(): JSX.Element | null {
  const { user, token, isAuthenticated } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Ne pas afficher si l'utilisateur n'est pas connecté, si l'email est vérifié, ou si la vérification a réussi
  if (!isAuthenticated || !user || user.email_verified !== false || verificationSuccess) {
    return null;
  }

  async function onResendVerificationCode(): Promise<void> {
    if (!user?.id || !token) return;
    setSendingCode(true);
    setVerificationError(null);
    try {
      await apiRequest("/auth/resend-code", {
        method: "POST",
        token,
        body: { userId: user.id, type: "verification" }
      });
      alert("Code de vérification renvoyé ! Vérifiez votre email.");
      setShowVerificationInput(true);
    } catch (e) {
      setVerificationError(e instanceof Error ? e.message : "Erreur lors de l'envoi du code");
    } finally {
      setSendingCode(false);
    }
  }

  async function onVerifyCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!user?.id || !verificationCode || !token) return;
    setVerifyingCode(true);
    setVerificationError(null);
    try {
      const data = await apiRequest<{ message: string; token: string; user: any }>("/auth/verify-email", {
        method: "POST",
        body: { userId: user.id, code: verificationCode }
      });
      setVerificationSuccess(true);
      alert("Email vérifié avec succès ! Rechargez la page.");
      window.location.reload();
    } catch (e) {
      setVerificationError(e instanceof Error ? e.message : "Code invalide ou expiré");
    } finally {
      setVerifyingCode(false);
    }
  }

  return (
    <div className="email-verification-banner">
      <div className="email-verification-container">
        <div className="email-verification-content">
          <span className="email-verification-icon">⚠️</span>
          <div className="email-verification-body">
            <h3 className="email-verification-title">
              Vérification d'email requise
            </h3>
            <p className="email-verification-message">
              Votre adresse email n'est pas encore vérifiée. Pour accéder à toutes les fonctionnalités, veuillez vérifier votre email.
            </p>
            
            {!showVerificationInput ? (
              <div className="email-verification-actions">
                <button
                  type="button"
                  className="email-verification-btn email-verification-btn-primary"
                  onClick={onResendVerificationCode}
                  disabled={sendingCode}
                >
                  {sendingCode ? "Envoi..." : "📧 Renvoyer le code de vérification"}
                </button>
                <button
                  type="button"
                  className="email-verification-btn email-verification-btn-secondary"
                  onClick={() => setShowVerificationInput(true)}
                >
                  ✍️ J'ai déjà un code
                </button>
              </div>
            ) : (
              <form onSubmit={onVerifyCode} className="email-verification-form">
                <div className="email-verification-form-content">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Entrez le code à 6 chiffres"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    className="email-verification-input"
                  />
                  <button
                    type="submit"
                    className="email-verification-btn email-verification-btn-success"
                    disabled={verifyingCode || verificationCode.length !== 6}
                  >
                    {verifyingCode ? "Vérification..." : "✅ Vérifier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationInput(false);
                      setVerificationCode("");
                      setVerificationError(null);
                    }}
                    className="email-verification-btn email-verification-btn-cancel"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
            
            {verificationError && (
              <p className="email-verification-error">
                ❌ {verificationError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
