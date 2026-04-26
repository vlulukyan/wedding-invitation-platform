import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { getStore } from "@netlify/blobs";

const UPLOAD_STORE = "uploads";
const API_UPLOAD_PREFIX = "/api/uploads/";
const PUBLIC_UPLOAD_PREFIX = "/uploads/";

type UploadEntry = {
  data: Blob;
  metadata?: {
    contentType?: string;
  };
};

function hasNetlifyBlobConfig() {
  return Boolean(process.env.NETLIFY_BLOBS_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN);
}

function getUploadStore() {
  return getStore(UPLOAD_STORE);
}

function getLocalUploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

function resolveLocalUploadPath(key: string) {
  const cleanKey = key.split("/").filter(Boolean);
  return path.join(getLocalUploadsDir(), ...cleanKey);
}

function getContentType(fileName: string, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".m4a":
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

export function sanitizeUploadName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "") || "upload";
}

export async function saveUpload(key: string, value: Blob) {
  if (hasNetlifyBlobConfig()) {
    await getUploadStore().set(key, value, {
      metadata: {
        contentType: value.type || "application/octet-stream",
      },
    });
    return `${API_UPLOAD_PREFIX}${key}`;
  }

  const filePath = resolveLocalUploadPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  const data = new Uint8Array(await value.arrayBuffer());
  await writeFile(filePath, data);
  return `${PUBLIC_UPLOAD_PREFIX}${key}`;
}

export async function getUpload(key: string): Promise<UploadEntry | null> {
  if (hasNetlifyBlobConfig()) {
    const entry = await getUploadStore().getWithMetadata(key, { type: "blob" });
    return entry ? ({ data: entry.data as Blob, metadata: entry.metadata } satisfies UploadEntry) : null;
  }

  const filePath = resolveLocalUploadPath(key);

  try {
    const data = await readFile(filePath);
    return {
      data: new Blob([data], { type: getContentType(filePath) }),
      metadata: {
        contentType: getContentType(filePath),
      },
    };
  } catch {
    return null;
  }
}

export async function deleteUploadUrl(url: string) {
  if (url.startsWith(API_UPLOAD_PREFIX)) {
    const key = url.slice(API_UPLOAD_PREFIX.length);
    if (!key) {
      return;
    }

    if (hasNetlifyBlobConfig()) {
      await getUploadStore().delete(key);
      return;
    }

    await rm(resolveLocalUploadPath(key), { force: true });
    return;
  }

  if (!url.startsWith(PUBLIC_UPLOAD_PREFIX)) {
    return;
  }

  const key = url.slice(PUBLIC_UPLOAD_PREFIX.length);
  if (!key) {
    return;
  }

  await rm(resolveLocalUploadPath(key), { force: true });
}
