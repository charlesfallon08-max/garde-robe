import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

// POST /api/upload — reçoit une image et la sauvegarde dans public/uploads/
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const pieceId = formData.get("pieceId") as string;

  if (!file || !pieceId) {
    return NextResponse.json({ error: "Fichier ou pieceId manquant" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Nom de fichier basé sur l'id de la pièce (remplace les espaces)
  const ext = file.name.split(".").pop() ?? "png";
  const filename = `${pieceId}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
