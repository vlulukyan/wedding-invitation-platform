import { NextRequest, NextResponse } from "next/server";

import { applyAdminSessionCookie, isPasswordValid } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !isPasswordValid(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  applyAdminSessionCookie(response);
  return response;
}
