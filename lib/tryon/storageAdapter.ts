/**
 * Thin storage boundary so the rest of the try-on module never talks to a
 * specific storage vendor directly.
 *
 * DEMO IMPLEMENTATION: putEphemeralObject below returns a base64 data URL
 * instead of writing to real object storage, so the deployed demo works
 * with zero infra setup. This is fine for the mock provider (which just
 * echoes the URL back to the browser) but will NOT work with a real
 * vendor like Perfect Corp — those APIs need a publicly fetchable HTTPS
 * URL, not a data URI, and data URLs are unbounded in size/unsuited to
 * production traffic. Before going live, replace this with your actual
 * CDN/object storage (S3, R2, Vercel Blob, Cloudinary, etc.) — reusing
 * whatever SHYN.ISH already uses for product images — and make sure it
 * enforces the ttlSeconds expiry natively (S3 lifecycle rule, R2 expiring
 * object, signed URL with a short TTL).
 */

export interface EphemeralObject {
  url: string;
  key: string;
}

export async function putEphemeralObject(
  key: string,
  data: Buffer,
  contentType: string,
  ttlSeconds: number
): Promise<EphemeralObject> {
  // Demo-only: no expiry is actually enforced here since nothing is
  // persisted server-side. Swap for real storage before production —
  // see the file header.
  void ttlSeconds;
  const dataUrl = `data:${contentType};base64,${data.toString("base64")}`;
  return { url: dataUrl, key };
}

/**
 * Character base images ship as static files under /public/tryon-characters
 * in this scaffold, so this just resolves them to an absolute URL. If you
 * move character assets to the CDN too, point this at that instead.
 */
export function resolveToPublicUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl) || pathOrUrl.startsWith("data:")) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${base.replace(/\/$/, "")}${pathOrUrl}`;
}
