import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { deleteInvitee, updateInvitee } from "@/lib/invitees";

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
  const updated = updateInvitee(id, data);
  return NextResponse.json({ invitee: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  deleteInvitee(id);
  return NextResponse.json({ ok: true });
}
