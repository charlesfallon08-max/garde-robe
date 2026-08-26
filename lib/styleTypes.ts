// Hiérarchie : catégorie → sous_type → styles
export const STYLE_TYPES: Record<string, Record<string, string[]>> = {
  hauts: {
    tee:     ["Basic color tshirt", "Heavyweight tshirt", "Graphic design", "Polo", "Tank top"],
    hoodie:  ["Coton ouaté", "Zip up", "Crewneck sweat"],
    shirt:   ["Chemise lin", "Chemise boutons", "Overshirt"],
    veste:   ["Bomber", "Denim jacket", "Overshirt jacket"],
    pull:    ["Turtleneck", "Col rond", "Cardigan"],
    manteau: ["Trench", "Parka", "Manteau laine", "Doudoune"],
  },
  bas: {
    short: ["Cotton short", "Linen short", "Jorts", "Swim short"],
    long:  ["Baggy jeans", "Straight jeans", "Relaxed jeans", "Linen pants", "Chino", "Jogging", "Pantalon laine"],
  },
  chaussures: {
    sneaker: ["Low top canvas", "Sambas / Gazelle", "Running"],
    sandal:  ["Birkenstock", "Slides", "Strappy sandal"],
    boot:    ["Chelsea boot", "Ankle boot", "Snow boot"],
  },
  accessoires: {
    cap:        ["Baseball cap", "Bucket hat", "Beanie"],
    sunglasses: ["Round", "Square", "Aviator"],
    bag:        ["Tote bag", "Backpack", "Crossbody"],
    belt:       ["Leather belt", "Canvas belt"],
    scarf:      ["Écharpe en laine", "Écharpe légère"],
    gloves:     ["Gants en cuir", "Gants tricot"],
  },
};

// Ordre d'affichage exact dans la grille
export const STYLE_SORT_ORDER: Record<string, string[]> = {
  hauts: [
    "Basic color tshirt", "Heavyweight tshirt", "Graphic design", "Polo", "Tank top",
    "Coton ouaté", "Zip up", "Crewneck sweat",
    "Chemise lin", "Chemise boutons", "Overshirt",
    "Bomber", "Denim jacket", "Overshirt jacket",
    "Turtleneck", "Col rond", "Cardigan",
    "Trench", "Parka", "Manteau laine", "Doudoune",
  ],
  bas: [
    "Cotton short", "Linen short", "Jorts", "Swim short",
    "Baggy jeans", "Straight jeans", "Relaxed jeans",
    "Linen pants", "Chino", "Jogging", "Pantalon laine",
  ],
  chaussures: [
    "Low top canvas", "Sambas / Gazelle", "Running",
    "Birkenstock", "Slides", "Strappy sandal",
    "Chelsea boot", "Ankle boot", "Snow boot",
  ],
  accessoires: [
    "Baseball cap", "Bucket hat", "Beanie",
    "Round", "Square", "Aviator",
    "Tote bag", "Backpack", "Crossbody",
    "Leather belt", "Canvas belt",
    "Écharpe en laine", "Écharpe légère",
    "Gants en cuir", "Gants tricot",
  ],
};

export function getStyles(categorie: string, sousType: string): string[] {
  return STYLE_TYPES[categorie]?.[sousType] ?? [];
}

export function getStyleSortIndex(categorie: string, styleType: string): number {
  const order = STYLE_SORT_ORDER[categorie] ?? [];
  const idx = order.indexOf(styleType);
  return idx === -1 ? 999 : idx;
}
