export function LegalNoticePage(): JSX.Element {
  return (
    <section className="page legal-notice-page">
      <article className="card legal-notice-card">
        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <p>QUOKKA</p>
        <p>
          Email : <a href="mailto:contact@quokka.gg">contact@quokka.gg</a>
        </p>

        <h2>Responsable de la publication</h2>
        <p>Mathieu Cerenzia – Créateur de Quokka</p>

        <h2>Hébergeur</h2>
        <p>Vercel</p>
        <p>Adresse : San Francisco, Californie, États-Unis</p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les contenus du site (textes, logos, marques, médias, code) sont protégés par les lois en vigueur. Toute
          reproduction ou représentation, totale ou partielle, sans autorisation préalable est interdite. Les marques et
          contenus cités restent la propriété de leurs titulaires respectifs.
        </p>

        <h2>Cookies et traceurs</h2>
        <p>
          Le site utilise des traceurs pour des finalités techniques, de mesure d’audience et, le cas échéant, marketing.
          Vous pouvez accepter, refuser ou paramétrer vos choix à tout moment via le gestionnaire de consentement (lien
          « Paramétrer les cookies » en bas de page).
        </p>
        <p>Durée de vie des cookies : 6 à 13 mois selon le cookie.</p>
        <p>Pour la mesure d’audience exempte, l’adresse IP est anonymisée et les données ne sont pas recoupées.</p>
      </article>
    </section>
  );
}
