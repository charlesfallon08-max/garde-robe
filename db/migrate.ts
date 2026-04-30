// Script d'initialisation de la table (à lancer une fois)
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
`);

console.log("✓ Table 'pieces' prête.");
sqlite.close();
