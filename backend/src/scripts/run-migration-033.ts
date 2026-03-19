import fs from "fs";
import path from "path";
import { db } from "../config/db.js";

async function runMigration() {
  const sqlPath = path.join(process.cwd(), "..", "sql", "033_optimize_indexes.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  try {
    await db.query(sql);
    console.log("Migration 033 applied successfully.");
  } catch (err) {
    console.error("Error applying migration 033:", err);
  } finally {
    process.exit(0);
  }
}

runMigration();