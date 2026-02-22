import pg from "pg";
import dotenv from "dotenv";

const { Client } = pg;

dotenv.config();

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

    const migrationSQL = `
      ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS guest_pseudo text;
    `;

    console.log("\n📝 Exécution de la migration...");
    await client.query(migrationSQL);
    console.log("✅ Migration appliquée avec succès!");

    const columns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_messages' AND column_name = 'guest_pseudo'
    `);

    if (columns.rows.length > 0) {
      console.log("✅ Colonne guest_pseudo créée");
    } else {
      console.log("❌ Colonne guest_pseudo non trouvée");
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
