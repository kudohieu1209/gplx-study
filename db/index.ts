import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { userSync } from "./schema";
import { Redis } from "@upstash/redis";

export interface UserRecord {
  syncCode: string;
  pinHash: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback for Vercel/Node environment when no external DB is bound
const memoryStore =
  (globalThis as any).__gplx_memory_store__ ||
  ((globalThis as any).__gplx_memory_store__ = new Map<string, UserRecord>());

// 1. Upstash Redis / Vercel KV Client (One-click in Vercel Storage tab)
function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

// 2. Turso (LibSQL SQLite)
let tursoDbInstance: any = null;
let tursoTableInit = false;

async function getTursoDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) return null;

  if (!tursoDbInstance) {
    const { createClient } = await import("@libsql/client");
    const { drizzle } = await import("drizzle-orm/libsql");
    const client = createClient({ url, authToken });
    tursoDbInstance = drizzle(client, { schema });
    if (!tursoTableInit) {
      tursoTableInit = true;
      try {
        await client.execute(`
          CREATE TABLE IF NOT EXISTS user_sync (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sync_code TEXT NOT NULL UNIQUE,
            pin_hash TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `);
      } catch (e) {
        console.error("Turso table init warning:", e);
      }
    }
  }
  return tursoDbInstance;
}

// 3. Cloudflare Workers D1
async function getCloudflareEnv(): Promise<any> {
  try {
    const mod = await import(/* webpackIgnore: true */ "cloudflare:workers");
    return mod?.env || null;
  } catch {
    return null;
  }
}

let cfTableInitPromise: Promise<void> | null = null;

async function getCloudflareD1Db() {
  const env = await getCloudflareEnv();
  if (env && env.DB) {
    const { drizzle } = await import("drizzle-orm/d1");
    if (!cfTableInitPromise) {
      cfTableInitPromise = (async () => {
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
        } catch (err) {
          console.error("Failed to ensure Cloudflare D1 table:", err);
          cfTableInitPromise = null;
        }
      })();
    }
    await cfTableInitPromise;
    return drizzle(env.DB, { schema });
  }
  return null;
}

// Unified Database Helpers
export async function findUserByCode(username: string): Promise<UserRecord | null> {
  // A. Try Vercel KV / Upstash Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const record = await redis.get<UserRecord>(`user:${username}`);
      if (record) return record;
    } catch (err) {
      console.error("Redis get error:", err);
    }
  }

  // B. Try Turso LibSQL
  const tursoDb = await getTursoDb();
  if (tursoDb) {
    try {
      const rows = await tursoDb.select().from(userSync).where(eq(userSync.syncCode, username)).limit(1);
      if (rows.length > 0) {
        return {
          syncCode: rows[0].syncCode,
          pinHash: rows[0].pinHash,
          data: rows[0].data,
          createdAt: rows[0].createdAt,
          updatedAt: rows[0].updatedAt,
        };
      }
      return null;
    } catch (err) {
      console.error("Turso select error:", err);
    }
  }

  // C. Try Cloudflare D1
  const cfDb = await getCloudflareD1Db();
  if (cfDb) {
    try {
      const existing = await cfDb.select().from(userSync).where(eq(userSync.syncCode, username)).limit(1);
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
    } catch (err) {
      console.error("Cloudflare D1 select error:", err);
    }
  }

  // D. Fallback file & memory storage (local dev / zero-config)
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
  // A. Vercel KV / Upstash Redis
  const redis = getRedisClient();
  if (redis) {
    await redis.set(`user:${record.syncCode}`, record);
    return;
  }

  // B. Turso LibSQL
  const tursoDb = await getTursoDb();
  if (tursoDb) {
    await tursoDb.insert(userSync).values({
      syncCode: record.syncCode,
      pinHash: record.pinHash,
      data: record.data,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return;
  }

  // C. Cloudflare D1
  const cfDb = await getCloudflareD1Db();
  if (cfDb) {
    await cfDb.insert(userSync).values({
      syncCode: record.syncCode,
      pinHash: record.pinHash,
      data: record.data,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return;
  }

  // D. Fallback storage
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
  // A. Vercel KV / Upstash Redis
  const redis = getRedisClient();
  if (redis) {
    const existing = await redis.get<UserRecord>(`user:${username}`);
    if (existing) {
      existing.data = dataStr;
      existing.updatedAt = updatedAt;
      await redis.set(`user:${username}`, existing);
    } else {
      await redis.set(`user:${username}`, {
        syncCode: username,
        pinHash: "",
        data: dataStr,
        createdAt: updatedAt,
        updatedAt,
      });
    }
    return;
  }

  // B. Turso LibSQL
  const tursoDb = await getTursoDb();
  if (tursoDb) {
    await tursoDb.update(userSync).set({ data: dataStr, updatedAt }).where(eq(userSync.syncCode, username));
    return;
  }

  // C. Cloudflare D1
  const cfDb = await getCloudflareD1Db();
  if (cfDb) {
    await cfDb.update(userSync).set({ data: dataStr, updatedAt }).where(eq(userSync.syncCode, username));
    return;
  }

  // D. Fallback storage
  const existing = await findUserByCode(username);
  if (existing) {
    existing.data = dataStr;
    existing.updatedAt = updatedAt;
    await saveUser(existing);
  }
}
