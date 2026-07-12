const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const SQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "gateway_configs" (
    "id" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "webhook_secret" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_configs_pkey" PRIMARY KEY ("id")
);

-- Insert into _prisma_migrations
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
    'add_gateway_config_001',
    'dummy_checksum',
    NOW(),
    '20260712000001_add_gateway_config',
    NULL,
    NULL,
    NOW(),
    1
)
ON CONFLICT DO NOTHING;
`;

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SQL);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
