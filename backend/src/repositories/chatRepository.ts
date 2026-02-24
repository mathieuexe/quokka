import { db } from "../config/db.js";

export async function banIp(ipAddress: string): Promise<void> {
  await db.query("INSERT INTO banned_ips (ip_address) VALUES ($1) ON CONFLICT (ip_address) DO NOTHING", [ipAddress]);
}

export async function isIpBanned(ipAddress: string): Promise<boolean> {
  const result = await db.query("SELECT 1 FROM banned_ips WHERE ip_address = $1", [ipAddress]);
  return result.rowCount > 0;
}
