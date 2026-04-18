import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { deleteBlock, updateBlock } from "@/lib/cms";
import { cmsBlockUpdateSchema } from "@/lib/cmsSchemas";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const data = await request.json().catch(() => ({}));
  const parsed = cmsBlockUpdateSchema.parse(data);
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  try {
    const { is_visible, ...blockData } = parsed;
    const updateData = {
      ...blockData,
      ...(is_visible === undefined ? {} : { is_visible: is_visible ? 1 : 0 }),
    };
    const updated = updateBlock(locale, params.slug, updateData);
    return NextResponse.json({ block: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update block";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  try {
    deleteBlock(locale, params.slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete block";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
