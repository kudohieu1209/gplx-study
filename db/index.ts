import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { userSync } from "./schema";

export interface UserRecord {
  syncCode: string;
  pinHash: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback for Vercel/Node environment
const memoryStore =
  (globalThis as any).__gplx_memory_store__ ||
  ((globalThis as any).__gplx_memory_store__ = new Map<string, UserRecord>());

async function getCloudflareEnv(): Promise<any> {
  try {
    const mod = await import(/* webpackIgnore: true */ "cloudflare:workers");
    return mod?.env || null;
  } catch {
    return null;
  }
}

export async function getDb() {
  const env = await getCloudflareEnv();
  if (env && env.DB) {
    const { drizzle } = await import("drizzle-orm/d1");
    return drizzle(env.DB, { schema });
  }
  return null;
}

let tableInitPromise: Promise<void> | null = null;

export async function ensureSyncTable() {
  const env = await getCloudflareEnv();
  if (!env || !env.DB) return;
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
        tableInitPromise = null;
      }
    })();
  }
  return tableInitPromise;
}

export async function findUserByCode(username: string): Promise<UserRecord | null> {
  await ensureSyncTable();
  const db = await getDb();
  if (db) {
    const existing = await db
      .select()
      .from(userSync)
      .where(eq(userSync.syncCode, username))
      .limit(1);
    if (existing.length > 0) {
      return {
        syncCode: existing[0].syncCode,
        pinHash: existing[0].pinHash,
        data: existing[0].data,
        createdAt: existing[0].createdAt,
        updatedAt: existing[0].updatedAt,
      };
    }
    return null;
  }

  // Fallback file & memory storage (for Vercel / Node.js)
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");
    const filePath = path.join(os.tmpdir(), "gplx_users.json");
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const obj = JSON.parse(content);
      if (obj[username]) return obj[username];
    } catch {}
  } catch {}

  return memoryStore.get(username) || null;
}

export async function saveUser(record: UserRecord): Promise<void> {
  await ensureSyncTable();
  const db = await getDb();
  if (db) {
    await db.insert(userSync).values({
      syncCode: record.syncCode,
      pinHash: record.pinHash,
      data: record.data,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return;
  }

  // Fallback storage
  memoryStore.set(record.syncCode, record);
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");
    const filePath = path.join(os.tmpdir(), "gplx_users.json");
    let current: Record<string, UserRecord> = {};
    try {
      current = JSON.parse(await fs.readFile(filePath, "utf-8"));
    } catch {}
    current[record.syncCode] = record;
    await fs.writeFile(filePath, JSON.stringify(current), "utf-8");
  } catch {}
}

export async function updateUserRecord(username: string, dataStr: string, updatedAt: string): Promise<void> {
  await ensureSyncTable();
  const db = await getDb();
  if (db) {
    await db
      .update(userSync)
      .set({ data: dataStr, updatedAt })
      .where(eq(userSync.syncCode, username));
    return;
  }

  // Fallback storage
  const existing = await findUserByCode(username);
  if (existing) {
    existing.data = dataStr;
    existing.updatedAt = updatedAt;
    await saveUser(existing);
  }
}
