import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { updateMenuItem, deleteMenuItem } from "@/lib/cms";
import { cmsMenuItemUpdateSchema } from "@/lib/cmsSchemas";

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
  const parsed = cmsMenuItemUpdateSchema.parse(data);
  const updated = await updateMenuItem(id, {
    ...parsed,
    is_visible: parsed.is_visible === undefined ? undefined : parsed.is_visible ? 1 : 0,
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await deleteMenuItem(id);
  return NextResponse.json({ ok: true });
}
