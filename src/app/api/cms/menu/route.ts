import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { createMenuItem, listMenu } from "@/lib/cms";
import { cmsMenuItemSchema } from "@/lib/cmsSchemas";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const menu = listMenu(locale || undefined);
  return NextResponse.json({ menu });
}

export async function POST(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const payload = await request.json().catch(() => ({}));
  const parsed = cmsMenuItemSchema.parse(payload);
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const created = createMenuItem(locale, {
    label: parsed.label,
    href: parsed.href,
    position: parsed.position,
    is_visible: parsed.is_visible === false ? 0 : 1,
  });
  return NextResponse.json({ item: created });
}
