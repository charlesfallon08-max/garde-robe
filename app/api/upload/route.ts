import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload — reçoit une image et la sauvegarde dans Vercel Blob
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const pieceId = formData.get("pieceId") as string;

  if (!file || !pieceId) {
    return NextResponse.json({ error: "Fichier ou pieceId manquant" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const filename = `pieces/${pieceId}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public", allowOverwrite: true });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[upload] Erreur Vercel Blob:", err);
    const message = err instanceof Error ? err.message : "Upload échoué";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
