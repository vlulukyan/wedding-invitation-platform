import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { getEventSection, updateEventSection } from "@/lib/cms";
import { eventSectionUpdateSchema } from "@/lib/cmsSchemas";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const event = await getEventSection(locale || undefined);
  return NextResponse.json({ event });
}

export async function PUT(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const data = await request.json().catch(() => ({}));
  const parsed = eventSectionUpdateSchema.parse(data);
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const updated = await updateEventSection(locale, parsed);
  return NextResponse.json({ event: updated });
}
