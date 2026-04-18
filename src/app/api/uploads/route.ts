import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { sanitizeUploadName, saveUpload } from "@/lib/blobStorage";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const isFileLike = typeof file === "object" && file !== null && typeof (file as Blob).arrayBuffer === "function";
  if (!isFileLike) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const blob = file as Blob;
  const blobName = (blob as { name?: string }).name;
  const originalName = typeof blobName === "string" ? blobName : "upload";
  const safeName = `${Date.now()}-${sanitizeUploadName(originalName)}`;
  const url = await saveUpload(safeName, blob);
  return NextResponse.json({ url });
}
