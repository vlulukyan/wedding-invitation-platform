import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { deleteMedia, updateMedia } from "@/lib/cms";
import { deleteUploadUrl } from "@/lib/blobStorage";

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
  const updated = await updateMedia(id, data);
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
  const current = await updateMedia(id, {});
  await deleteMedia(id);
  await deleteUploadUrl(current.image_url);
  return NextResponse.json({ ok: true });
}
