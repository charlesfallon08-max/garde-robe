import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const pieces = sqliteTable("pieces", {
  id:          text("id").primaryKey(),          // ex: "s1", "s2" ou uuid
  marque:      text("marque").notNull(),
  nom:         text("nom").notNull(),
  categorie:   text("categorie").notNull(),       // hauts | bas | chaussures | accessoires
  sous_type:   text("sous_type").notNull(),        // tee | shirt | short | jeans | sneaker | sandal | ...
  couleur_hex: text("couleur_hex").notNull(),
  couleur_nom: text("couleur_nom").notNull(),
  prix_cad:    real("prix_cad"),
  url_achat:   text("url_achat"),
  image_url:   text("image_url"),
  notes:       text("notes"),
  date_ajout:  text("date_ajout").notNull(),       // ISO string
});

export type Piece = typeof pieces.$inferSelect;
export type NewPiece = typeof pieces.$inferInsert;
