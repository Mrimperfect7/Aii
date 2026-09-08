/**
 * Thin storage boundary so the rest of the try-on module never talks to a
 * specific storage vendor directly. Implement these two functions against
 * whatever SHYN.ISH already uses for product images (S3, Cloudflare R2,
 * Vercel Blob, Cloudinary, etc.) — reusing the existing CDN, per the spec's
 * "reuse existing image CDN" requirement, rather than standing up a second one.
 *
 * putEphemeralObject MUST set the store's native TTL/expiry so uploaded
 * selfies are actually deleted after ttlSeconds even if nothing else in the
 * app calls a cleanup job. Most object stores support this natively
 * (S3 lifecycle rules, R2 expiring objects, signed URLs with short TTLs).
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
  throw new Error(
    "storageAdapter.putEphemeralObject is a stub — wire this to your CDN/object storage before going live. " +
      `(key=${key}, bytes=${data.byteLength}, contentType=${contentType}, ttlSeconds=${ttlSeconds})`
  );
}

/**
 * Character base images ship as static files under /public/tryon-characters
 * in this scaffold, so this just resolves them to an absolute URL. If you
 * move character assets to the CDN too, point this at that instead.
 */
export function resolveToPublicUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${base.replace(/\/$/, "")}${pathOrUrl}`;
}
