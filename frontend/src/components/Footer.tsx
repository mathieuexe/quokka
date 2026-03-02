import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer(): JSX.Element {
  const year = new Date().getFullYear();
  const { t, i18n } = useTranslation();

  const currentLanguage = useMemo(() => {
    const raw = i18n.resolvedLanguage ?? i18n.language ?? "fr";
    return raw.split("-")[0] ?? "fr";
  }, [i18n.language, i18n.resolvedLanguage]);

  const languages = useMemo(
    () => [
      { code: "fr", label: "Français" },
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
      { code: "de", label: "Deutsch" },
      { code: "it", label: "Italiano" },
      { code: "pt", label: "Português" },
      { code: "zh", label: "中文" },
      { code: "ja", label: "日本語" },
      { code: "hi", label: "हिन्दी" },
      { code: "ru", label: "Русский" },
      { code: "uk", label: "Українська" }
    ],
    []
  );

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-links">
          <p>{t("footer.copyright", { year })}</p>
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/blog">{t("footer.blog")}</Link>
        </div>
        <div className="footer-language-block">
          <div className="footer-language">
            <span className="footer-language-label">{t("auth.language")}</span>
            <select
              value={currentLanguage}
              onChange={(event) => void i18n.changeLanguage(event.target.value)}
              aria-label={t("auth.language")}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="footer-socials">
            <a href="https://stt.gg/G2PMQnWx" target="_blank" rel="noreferrer" aria-label="Stoat">
              <img src="/images/icons/stoat-circle.png" alt="Stoat" loading="lazy" />
            </a>
            <a href="https://bsky.app/profile/quokka.gg" target="_blank" rel="noreferrer" aria-label="Bluesky">
              <img src="/images/icons/bluesky-circle.png" alt="Bluesky" loading="lazy" />
            </a>
            <a href="https://github.com/mathieuexe/quokka" target="_blank" rel="noreferrer" aria-label="Github">
              <img src="/images/icons/github-circle.png" alt="Github" loading="lazy" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
