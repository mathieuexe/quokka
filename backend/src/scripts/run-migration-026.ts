import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const { Client } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL?.replace("-pooler", "");

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL non trouvée dans .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: true
    }
  });

  try {
    console.log("🔌 Connexion à la base de données...");
    await client.connect();
    console.log("✅ Connecté à la base de données");

    const migrationPath = join(__dirname, "..", "..", "..", "sql", "026_add_habbo_category.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("\n📝 Exécution de la migration...");
    await client.query(migrationSQL);
    console.log("✅ Migration appliquée avec succès!");

    const categories = await client.query(`
      SELECT slug, label
      FROM categories
      WHERE slug = 'habbo'
      LIMIT 1
    `);

    if (categories.rows.length) {
      console.log(`✅ Catégorie créée: ${categories.rows[0].label}`);
    } else {
      console.log("❌ Catégorie Habbo non trouvée");
    }

    console.log("\n🎉 Migration terminée avec succès!");
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

runMigration();
