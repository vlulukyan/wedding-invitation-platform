import { NextRequest, NextResponse } from "next/server";

import { getUpload } from "@/lib/blobStorage";

export async function GET(_request: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  const entry = await getUpload(key);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType =
    typeof entry.metadata?.contentType === "string" ? entry.metadata.contentType : "application/octet-stream";

  return new Response(entry.data as Blob, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
