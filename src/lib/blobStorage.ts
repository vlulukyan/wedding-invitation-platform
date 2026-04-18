import { getStore } from "@netlify/blobs";

const UPLOAD_STORE = "uploads";

function getUploadStore() {
  return getStore(UPLOAD_STORE);
}

export function sanitizeUploadName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "") || "upload";
}

export async function saveUpload(key: string, value: Blob) {
  await getUploadStore().set(key, value, {
    metadata: {
      contentType: value.type || "application/octet-stream",
    },
  });
  return `/api/uploads/${key}`;
}

export async function getUpload(key: string) {
  return getUploadStore().getWithMetadata(key, { type: "blob" });
}

export async function deleteUploadUrl(url: string) {
  const prefix = "/api/uploads/";
  if (!url.startsWith(prefix)) {
    return;
  }
  const key = url.slice(prefix.length);
  if (key) {
    await getUploadStore().delete(key);
  }
}
