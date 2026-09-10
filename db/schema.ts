import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userSync = sqliteTable("user_sync", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  syncCode: text("sync_code").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  data: text("data").notNull(), // JSON: { progress, bookmarks, userNotes, studyDays, theme }
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
