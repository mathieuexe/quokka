CREATE SEQUENCE IF NOT EXISTS server_reference_number_seq;

ALTER TABLE servers
ADD COLUMN IF NOT EXISTS reference_number integer;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM servers
)
UPDATE servers s
SET reference_number = ordered.rn
FROM ordered
WHERE s.id = ordered.id
  AND s.reference_number IS NULL;

SELECT setval(
  'server_reference_number_seq',
  (SELECT COALESCE(MAX(reference_number), 0) FROM servers)
);

ALTER TABLE servers
ALTER COLUMN reference_number SET DEFAULT nextval('server_reference_number_seq');

ALTER TABLE servers
ALTER COLUMN reference_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS servers_reference_number_uq ON servers(reference_number);
