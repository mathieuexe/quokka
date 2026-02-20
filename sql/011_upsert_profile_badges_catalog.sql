BEGIN;

INSERT INTO badges (slug, label, image_url)
VALUES
  (
    'fondateur',
    'Fondateur de Quokka',
    'https://quokka.gg/images/badges/q.png'
  ),
  (
    'developpeur_quokka',
    'Développeur de Quokka',
    'https://quokka.gg/images/badges/dev.png'
  ),
  (
    '100_premiers_utilisateurs',
    'Fait partie des 100 premiers utilisateurs',
    'https://quokka.gg/images/badges/100.png'
  ),
  (
    'moderateur_quokka',
    'Modérateur de Quokka',
    'https://quokka.gg/images/badges/moderator.png'
  ),
  (
    'soutien_financier_quokka',
    'Soutien Quokka financièrement',
    'https://quokka.gg/images/badges/don.png'
  )
ON CONFLICT (slug) DO UPDATE
SET
  label = EXCLUDED.label,
  image_url = EXCLUDED.image_url;

COMMIT;
