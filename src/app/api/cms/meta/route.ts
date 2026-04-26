import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { getCmsPayload, updateCmsMeta } from "@/lib/cms";
import { cmsMetaUpdateSchema } from "@/lib/cmsSchemas";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const { meta } = await getCmsPayload(locale || undefined);
  return NextResponse.json({ meta });
}

export async function PUT(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const data = await request.json().catch(() => ({}));
  const result = cmsMetaUpdateSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    return NextResponse.json(
      {
        error: field ? `${field}: ${issue.message}` : issue?.message ?? "Invalid meta data",
      },
      { status: 400 }
    );
  }
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  const updated = await updateCmsMeta(locale, result.data);
  return NextResponse.json({ meta: updated });
}
