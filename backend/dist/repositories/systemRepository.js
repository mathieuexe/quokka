import { db } from "../config/db.js";
export async function getMaintenanceSettings() {
    const result = await db.query("SELECT is_enabled, message, allowed_ips FROM maintenance_settings WHERE id = 1");
    return result.rows[0];
}
export async function updateMaintenanceSettings(settings) {
    await db.query(`
      UPDATE maintenance_settings
      SET is_enabled = $1,
          message = $2,
          allowed_ips = $3
      WHERE id = 1
    `, [settings.is_enabled, settings.message, settings.allowed_ips]);
}
