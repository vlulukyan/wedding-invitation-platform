import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { getCoupleSection, updateCoupleSection } from "@/lib/cms";
import { coupleSectionUpdateSchema } from "@/lib/cmsSchemas";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const couple = await getCoupleSection(locale || undefined);
  return NextResponse.json({ couple });
}

export async function PUT(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const data = await request.json().catch(() => ({}));
  const parsed = coupleSectionUpdateSchema.parse(data);
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const updated = await updateCoupleSection(locale, parsed);
  return NextResponse.json({ couple: updated });
}
