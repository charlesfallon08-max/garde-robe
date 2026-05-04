import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "garde-robe.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS pieces (
    id          TEXT PRIMARY KEY,
    marque      TEXT NOT NULL,
    nom         TEXT NOT NULL,
    categorie   TEXT NOT NULL,
    sous_type   TEXT NOT NULL,
    couleur_hex TEXT NOT NULL,
    couleur_nom TEXT NOT NULL,
    prix_cad    REAL,
    url_achat   TEXT,
    image_url   TEXT,
    notes       TEXT,
    date_ajout  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS outfits (
    id          TEXT PRIMARY KEY,
    pieces_ids  TEXT NOT NULL,
    occasion    TEXT,
    explication TEXT,
    score       INTEGER,
    prix_total  REAL,
    date_ajout  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS preferences (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    pieces_ids  TEXT NOT NULL,
    occasion    TEXT,
    raison      TEXT,
    date_ajout  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usage_stats (
    id              TEXT PRIMARY KEY,
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    cached_tokens   INTEGER NOT NULL DEFAULT 0,
    outfits_generes INTEGER NOT NULL DEFAULT 0,
    date            TEXT NOT NULL
  );
`);

console.log("✓ Toutes les tables sont prêtes.");
sqlite.close();
