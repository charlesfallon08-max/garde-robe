import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const pieces = sqliteTable("pieces", {
  id:          text("id").primaryKey(),
  user_id:     text("user_id"),
  marque:      text("marque").notNull(),
  nom:         text("nom").notNull(),
  categorie:   text("categorie").notNull(),
  sous_type:   text("sous_type").notNull(),
  couleur_hex: text("couleur_hex").notNull(),
  couleur_nom: text("couleur_nom").notNull(),
  prix_cad:    real("prix_cad"),
  url_achat:   text("url_achat"),
  image_url:   text("image_url"),
  style_type:  text("style_type"),
  saison:      text("saison").default("ete"),
  statut:      text("statut").default("possédé"),
  notes:       text("notes"),
  date_ajout:  text("date_ajout").notNull(),
});

// Outfits sauvegardés
export const outfits = sqliteTable("outfits", {
  id:          text("id").primaryKey(),
  user_id:     text("user_id"),
  pieces_ids:  text("pieces_ids").notNull(),
  occasion:    text("occasion"),
  explication: text("explication"),
  score:       integer("score"),
  prix_total:  real("prix_total"),
  date_ajout:  text("date_ajout").notNull(),
});

// Préférences apprises (likes/dislikes de combinaisons)
export const preferences = sqliteTable("preferences", {
  id:          text("id").primaryKey(),
  user_id:     text("user_id"),
  type:        text("type").notNull(),
  pieces_ids:  text("pieces_ids").notNull(),
  occasion:    text("occasion"),
  meteo:       text("meteo"),
  raison:      text("raison"),
  date_ajout:  text("date_ajout").notNull(),
});

// Stats d'utilisation de l'API
export const usage_stats = sqliteTable("usage_stats", {
  id:              text("id").primaryKey(),
  input_tokens:    integer("input_tokens").notNull().default(0),
  output_tokens:   integer("output_tokens").notNull().default(0),
  cached_tokens:   integer("cached_tokens").notNull().default(0),
  outfits_generes: integer("outfits_generes").notNull().default(0),
  date:            text("date").notNull(),     // YYYY-MM
});

export type Piece       = typeof pieces.$inferSelect;
export type NewPiece    = typeof pieces.$inferInsert;
export type Outfit      = typeof outfits.$inferSelect;
export type Preference  = typeof preferences.$inferSelect;
export type UsageStat   = typeof usage_stats.$inferSelect;
