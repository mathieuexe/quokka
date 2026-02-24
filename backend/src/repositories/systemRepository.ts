import { db } from "../config/db.js";

export type MaintenanceSettings = {
  is_enabled: boolean;
  message: string;
  allowed_ips: string;
};

let maintenanceSchemaReady: Promise<void> | null = null;

async function ensureMaintenanceSchema(): Promise<void> {
  if (!maintenanceSchemaReady) {
    maintenanceSchemaReady = (async () => {
      try {
        await db.query(
          `
            CREATE TABLE IF NOT EXISTS maintenance_settings (
              id int PRIMARY KEY,
              is_enabled boolean NOT NULL DEFAULT FALSE,
              message text NOT NULL DEFAULT '',
              allowed_ips text NOT NULL DEFAULT '',
              updated_at timestamptz NOT NULL DEFAULT NOW()
            )
          `
        );
        await db.query(
          `
            INSERT INTO maintenance_settings (id, is_enabled, message, allowed_ips)
            VALUES (1, FALSE, '', '')
            ON CONFLICT (id) DO NOTHING
          `
        );
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW()");
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS allowed_ips text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT FALSE");
      } catch (error) {
        console.error("Maintenance schema init failed:", error);
      }
    })();
  }
  await maintenanceSchemaReady;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  try {
    await ensureMaintenanceSchema();
    const result = await db.query<MaintenanceSettings>("SELECT is_enabled, message, allowed_ips FROM maintenance_settings WHERE id = 1");
    return result.rows[0] ?? { is_enabled: false, message: "", allowed_ips: "" };
  } catch (error) {
    console.error("Maintenance settings load failed:", error);
    return { is_enabled: false, message: "", allowed_ips: "" };
  }
}

export async function updateMaintenanceSettings(settings: MaintenanceSettings): Promise<void> {
  await ensureMaintenanceSchema();
  await db.query(
    `
      UPDATE maintenance_settings
      SET is_enabled = $1,
          message = $2,
          allowed_ips = $3,
          updated_at = NOW()
      WHERE id = 1
    `,
    [settings.is_enabled, settings.message, settings.allowed_ips]
  );
}
