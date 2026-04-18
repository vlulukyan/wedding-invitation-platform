import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { hasValidSessionFromRequest } from "@/lib/adminAuth";
import { createMedia, listMedia } from "@/lib/cms";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function optionalFormString(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  return value || undefined;
}

export async function GET(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const collection = request.nextUrl.searchParams.get("collection");
  const locale = request.nextUrl.searchParams.get("locale") || undefined;
  if (!collection) {
    return NextResponse.json({ error: "Missing collection" }, { status: 400 });
  }
  const items = listMedia(collection, locale || undefined);
  return NextResponse.json({ media: items });
}

export async function POST(request: NextRequest) {
  if (!hasValidSessionFromRequest(request)) {
    return unauthorized();
  }
  const collection = request.nextUrl.searchParams.get("collection");
  const localeInput = request.nextUrl.searchParams.get("locale") || undefined;
  if (!collection) {
    return NextResponse.json({ error: "Missing collection" }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    if (!body.image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }
    const created = createMedia({
      collection,
      locale: localeInput,
      image_url: body.image_url,
      title: body.title,
      description: body.description,
      link_url: body.link_url,
      position: body.position,
    });
    return NextResponse.json({ media: created });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const isFileLike = typeof file === "object" && file !== null && typeof (file as Blob).arrayBuffer === "function";
  if (!isFileLike) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const blob = file as Blob;
  const buffer = new Uint8Array(await blob.arrayBuffer());
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const blobName = (blob as { name?: string }).name;
  const originalName = typeof blobName === "string" ? blobName : "upload";
  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9_.-]/g, "") || "upload"}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  await fs.writeFile(filePath, buffer);
  const publicUrl = `/uploads/${safeName}`;

  const created = createMedia({
    collection,
    locale: localeInput,
    image_url: publicUrl,
    title: optionalFormString(formData, "title"),
    description: optionalFormString(formData, "description"),
    link_url: optionalFormString(formData, "link_url"),
    position: formData.get("position") ? Number(formData.get("position")) : undefined,
  });
  return NextResponse.json({ media: created });
}
