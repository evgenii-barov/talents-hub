import { API_URL, apiFormFetch } from "@/lib/api";
import type { MediaAsset } from "@/lib/contracts";

export function uploadProfileImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFormFetch<MediaAsset>("/v1/me/media/", form);
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL.replace(/\/api$/, "")}${url}`;
}
