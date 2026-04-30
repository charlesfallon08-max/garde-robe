import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

// Stocke la DB dans le dossier du projet (hors node_modules)
const dbPath = path.join(process.cwd(), "garde-robe.db");
const sqlite = new Database(dbPath);

// Active le mode WAL pour de meilleures performances
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
