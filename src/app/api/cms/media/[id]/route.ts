import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { deleteMedia, updateMedia } from "@/lib/cms";

const UPLOAD_DIR = path.join(process.cwd(), "public");

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const data = await request.json().catch(() => ({}));
  const updated = updateMedia(id, data);
  return NextResponse.json({ media: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const current = updateMedia(id, {});
  deleteMedia(id);
  if (current?.image_url?.startsWith("/uploads/")) {
    const filePath = path.join(UPLOAD_DIR, current.image_url.replace(/^\//, ""));
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }
  return NextResponse.json({ ok: true });
}
