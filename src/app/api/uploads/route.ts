import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const isFileLike = typeof file === "object" && file !== null && typeof (file as Blob).arrayBuffer === "function";
  if (!isFileLike) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const blob = file as Blob;
  const buffer = new Uint8Array(await blob.arrayBuffer());
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const blobName = (blob as { name?: string }).name;
  const originalName = typeof blobName === "string" ? blobName : "upload";
  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9_.-]/g, "") || "upload"}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  await fs.writeFile(filePath, buffer);
  const url = `/uploads/${safeName}`;
  return NextResponse.json({ url });
}
