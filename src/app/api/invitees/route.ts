import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { createInvitee, listInvitees } from "@/lib/invitees";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const invitees = listInvitees();
  return NextResponse.json({ invitees });
}

export async function POST(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const data = await request.json().catch(() => ({}));
  const invitee = createInvitee({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    locale: data.locale,
  });
  return NextResponse.json({ invitee });
}
