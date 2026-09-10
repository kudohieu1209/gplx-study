import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

let tableInitPromise: Promise<void> | null = null;

export async function ensureSyncTable() {
  if (!env.DB) return;
  if (!tableInitPromise) {
    tableInitPromise = (async () => {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS user_sync (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            sync_code TEXT NOT NULL UNIQUE,
            pin_hash TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `).run();
        await env.DB.prepare(`
          CREATE UNIQUE INDEX IF NOT EXISTS user_sync_sync_code_unique ON user_sync (sync_code)
        `).run();
      } catch (err) {
        console.error("Failed to ensure user_sync table:", err);
        tableInitPromise = null; // reset to allow retry
      }
    })();
  }
  return tableInitPromise;
}
