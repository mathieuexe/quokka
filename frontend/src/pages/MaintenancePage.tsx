import { useTranslation } from "react-i18next";

export function MaintenancePage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="maintenance-page">
      <a className="maintenance-logo-link" href="/" aria-label="Quokka">
        <img className="maintenance-logo" src="https://quokka.gg/images/logomaintenance.png" alt="Quokka" />
      </a>

      <article className="maintenance-card">
        <p>{t("maintenance.message")}</p>
        <p>{t("maintenance.followUs")}</p>

        <div className="maintenance-socials">
          <a
            href="https://bsky.app/profile/quokka.gg"
            target="_blank"
            rel="noreferrer"
            aria-label="Bluesky Quokka"
            title="Bluesky"
          >
            <img src="https://bsky.app/static/favicon-32x32.png" alt="Bluesky" />
          </a>
          <a href="https://stoat.chat/invite/krQG9Mv8" target="_blank" rel="noreferrer" aria-label="Stoat Quokka" title="Stoat">
            <img
              src="https://cdn.bsky.app/img/avatar/plain/did:plc:qyajbfzm2uhjni6gnkgboga2/bafkreiexpqtfjezmbnttj2xjwlb42tq2qgguqdbfagik7jowoavz4kdrz4@jpeg"
              alt="Stoat"
            />
          </a>
        </div>
      </article>
    </section>
  );
}
