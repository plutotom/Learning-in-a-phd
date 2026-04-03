// Run once to create better-auth tables in auth.db
// Usage: node scripts/migrate.mjs

import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Parse .env manually (no dotenv dependency needed)
try {
  const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const authConfig = {
  database: new Database(resolve(__dirname, "../auth.db")),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "placeholder",
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:5123"],
};

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(authConfig);

if (toBeCreated.length === 0 && toBeAdded.length === 0) {
  console.log("Already up to date.");
  process.exit(0);
}

console.log("Creating tables:", toBeCreated.map((t) => t.table).join(", ") || "none");
await runMigrations();
console.log("Done.");
