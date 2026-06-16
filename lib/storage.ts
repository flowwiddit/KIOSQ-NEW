import { StorageClient } from "@supabase/storage-js";

export function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return new StorageClient(`${url}/storage/v1`, {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`
  });
}

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "kiosq-assets";
}
