import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { createBlock, listBlocks } from "@/lib/cms";
import { cmsBlockSchema } from "@/lib/cmsSchemas";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const blocks = await listBlocks(locale || undefined);
  return NextResponse.json({ blocks });
}

export async function POST(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const data = await request.json().catch(() => ({}));
  const parsed = cmsBlockSchema.parse(data);
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const created = await createBlock(locale, {
    slug: parsed.slug,
    selector: parsed.selector,
    content_html: parsed.content_html,
    position: parsed.position,
    is_visible: parsed.is_visible ? 1 : 0,
  });
  return NextResponse.json({ block: created });
}
