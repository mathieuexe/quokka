import { db } from "../config/db.js";

export type MaintenanceSettings = {
  is_enabled: boolean;
  message: string;
  allowed_ips: string;
  discord_auth_enabled: boolean;
  discord_auth_message: string;
};

export type AnnouncementSettings = {
  is_enabled: boolean;
  text: string;
  icon: string;
  cta_label: string;
  cta_url: string;
  countdown_target: string;
};

export type SiteBrandingSettings = {
  site_title: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
};

let maintenanceSchemaReady: Promise<void> | null = null;
let announcementSchemaReady: Promise<void> | null = null;
let brandingSchemaReady: Promise<void> | null = null;

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
              discord_auth_enabled boolean NOT NULL DEFAULT FALSE,
              discord_auth_message text NOT NULL DEFAULT '',
              updated_at timestamptz NOT NULL DEFAULT NOW()
            )
          `
        );
        await db.query(
          `
            INSERT INTO maintenance_settings (id, is_enabled, message, allowed_ips, discord_auth_enabled, discord_auth_message)
            VALUES (1, FALSE, '', '', FALSE, '')
            ON CONFLICT (id) DO NOTHING
          `
        );
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW()");
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS discord_auth_message text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE maintenance_settings ADD COLUMN IF NOT EXISTS discord_auth_enabled boolean NOT NULL DEFAULT FALSE");
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

async function ensureAnnouncementSchema(): Promise<void> {
  if (!announcementSchemaReady) {
    announcementSchemaReady = (async () => {
      try {
        await db.query(
          `
            CREATE TABLE IF NOT EXISTS announcement_settings (
              id int PRIMARY KEY,
              is_enabled boolean NOT NULL DEFAULT FALSE,
              text text NOT NULL DEFAULT '',
              icon text NOT NULL DEFAULT '',
              cta_label text NOT NULL DEFAULT '',
              cta_url text NOT NULL DEFAULT '',
              countdown_target text NOT NULL DEFAULT '',
              updated_at timestamptz NOT NULL DEFAULT NOW()
            )
          `
        );
        await db.query(
          `
            INSERT INTO announcement_settings (id, is_enabled, text, icon, cta_label, cta_url, countdown_target)
            VALUES (1, FALSE, '', '', '', '', '')
            ON CONFLICT (id) DO NOTHING
          `
        );
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW()");
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS countdown_target text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS cta_url text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS cta_label text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS text text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE announcement_settings ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT FALSE");
      } catch (error) {
        console.error("Announcement schema init failed:", error);
      }
    })();
  }
  await announcementSchemaReady;
}

async function ensureBrandingSchema(): Promise<void> {
  if (!brandingSchemaReady) {
    brandingSchemaReady = (async () => {
      try {
        await db.query(
          `
            CREATE TABLE IF NOT EXISTS site_branding_settings (
              id int PRIMARY KEY,
              site_title text NOT NULL DEFAULT '',
              site_description text NOT NULL DEFAULT '',
              logo_url text NOT NULL DEFAULT '',
              favicon_url text NOT NULL DEFAULT '',
              updated_at timestamptz NOT NULL DEFAULT NOW()
            )
          `
        );
        await db.query(
          `
            INSERT INTO site_branding_settings (id, site_title, site_description, logo_url, favicon_url)
            VALUES (1, '', '', '', '')
            ON CONFLICT (id) DO NOTHING
          `
        );
        await db.query("ALTER TABLE site_branding_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW()");
        await db.query("ALTER TABLE site_branding_settings ADD COLUMN IF NOT EXISTS favicon_url text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE site_branding_settings ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE site_branding_settings ADD COLUMN IF NOT EXISTS site_description text NOT NULL DEFAULT ''");
        await db.query("ALTER TABLE site_branding_settings ADD COLUMN IF NOT EXISTS site_title text NOT NULL DEFAULT ''");
      } catch (error) {
        console.error("Branding schema init failed:", error);
      }
    })();
  }
  await brandingSchemaReady;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  try {
    await ensureMaintenanceSchema();
    const result = await db.query<MaintenanceSettings>(
      "SELECT is_enabled, message, allowed_ips, discord_auth_enabled, discord_auth_message FROM maintenance_settings WHERE id = 1"
    );
    return (
      result.rows[0] ?? {
        is_enabled: false,
        message: "",
        allowed_ips: "",
        discord_auth_enabled: false,
        discord_auth_message: ""
      }
    );
  } catch (error) {
    console.error("Maintenance settings load failed:", error);
    return { is_enabled: false, message: "", allowed_ips: "", discord_auth_enabled: false, discord_auth_message: "" };
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
          discord_auth_enabled = $4,
          discord_auth_message = $5,
          updated_at = NOW()
      WHERE id = 1
    `,
    [settings.is_enabled, settings.message, settings.allowed_ips, settings.discord_auth_enabled, settings.discord_auth_message]
  );
}

export async function getAnnouncementSettings(): Promise<AnnouncementSettings> {
  try {
    await ensureAnnouncementSchema();
    const result = await db.query<AnnouncementSettings>(
      "SELECT is_enabled, text, icon, cta_label, cta_url, countdown_target FROM announcement_settings WHERE id = 1"
    );
    return (
      result.rows[0] ?? {
        is_enabled: false,
        text: "",
        icon: "",
        cta_label: "",
        cta_url: "",
        countdown_target: ""
      }
    );
  } catch (error) {
    console.error("Announcement settings load failed:", error);
    return { is_enabled: false, text: "", icon: "", cta_label: "", cta_url: "", countdown_target: "" };
  }
}

export async function updateAnnouncementSettings(settings: AnnouncementSettings): Promise<AnnouncementSettings> {
  await ensureAnnouncementSchema();
  const result = await db.query<AnnouncementSettings>(
    `
      INSERT INTO announcement_settings (id, is_enabled, text, icon, cta_label, cta_url, countdown_target, updated_at)
      VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        text = EXCLUDED.text,
        icon = EXCLUDED.icon,
        cta_label = EXCLUDED.cta_label,
        cta_url = EXCLUDED.cta_url,
        countdown_target = EXCLUDED.countdown_target,
        updated_at = NOW()
      RETURNING is_enabled, text, icon, cta_label, cta_url, countdown_target
    `,
    [settings.is_enabled, settings.text, settings.icon, settings.cta_label, settings.cta_url, settings.countdown_target]
  );
  return result.rows[0] ?? settings;
}

export async function getSiteBrandingSettings(): Promise<SiteBrandingSettings> {
  try {
    await ensureBrandingSchema();
    const result = await db.query<SiteBrandingSettings>(
      "SELECT site_title, site_description, logo_url, favicon_url FROM site_branding_settings WHERE id = 1"
    );
    return (
      result.rows[0] ?? {
        site_title: "",
        site_description: "",
        logo_url: "",
        favicon_url: ""
      }
    );
  } catch (error) {
    console.error("Branding settings load failed:", error);
    return { site_title: "", site_description: "", logo_url: "", favicon_url: "" };
  }
}

export async function updateSiteBrandingSettings(settings: SiteBrandingSettings): Promise<void> {
  await ensureBrandingSchema();
  await db.query(
    `
      UPDATE site_branding_settings
      SET site_title = $1,
          site_description = $2,
          logo_url = $3,
          favicon_url = $4,
          updated_at = NOW()
      WHERE id = 1
    `,
    [settings.site_title, settings.site_description, settings.logo_url, settings.favicon_url]
  );
}
