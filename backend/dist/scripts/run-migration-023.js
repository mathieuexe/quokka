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
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS users_discord (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        discord_id text NOT NULL UNIQUE,
        username text NOT NULL,
        avatar_url text,
        email text,
        locale text,
        profile jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
    `;
        console.log("\n📝 Exécution de la migration...");
        await client.query(migrationSQL);
        console.log("✅ Migration appliquée avec succès!");
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users_discord'
    `);
        if (tables.rows.length > 0) {
            console.log("✅ Table users_discord créée");
        }
        else {
            console.log("❌ Table users_discord non trouvée");
        }
        console.log("\n🎉 Migration terminée avec succès!");
    }
    catch (error) {
        console.error("\n❌ Erreur lors de la migration:", error);
        process.exit(1);
    }
    finally {
        await client.end();
        console.log("\n🔌 Déconnexion de la base de données");
    }
}
runMigration();
