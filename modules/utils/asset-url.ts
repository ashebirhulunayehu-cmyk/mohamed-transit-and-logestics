import { API_BASE } from "@/modules/api/routes";

export const resolveApiAssetUrl = (value: string | null | undefined): string | undefined => {
  const asset = value?.trim();
  if (!asset) return undefined;
  if (/^(blob|data):/i.test(asset)) return asset;

  try {
    const url = new URL(asset);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    try {
      const apiOrigin = new URL(API_BASE).origin;
      return new URL(asset.replace(/\\/g, "/"), `${apiOrigin}/`).href;
    } catch {
      return undefined;
    }
  }
};
