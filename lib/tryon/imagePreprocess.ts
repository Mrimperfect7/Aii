import sharp from "sharp";
import { randomUUID } from "crypto";
import { TryOnError } from "./types";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — friendly ceiling before we even try to process
const MAX_DIMENSION = 2048; // resize anything larger before it hits the provider

/**
 * Validates and normalizes a user-uploaded photo (selfie or gallery upload).
 * Throws TryOnError with a customer-safe message on any problem.
 */
export async function preprocessUpload(file: Buffer, mimeType: string): Promise<Buffer> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new TryOnError(
      "UNSUPPORTED_FILE_TYPE",
      "Please upload a JPG, PNG, or WebP photo."
    );
  }

  if (file.byteLength > MAX_UPLOAD_BYTES) {
    throw new TryOnError(
      "FILE_TOO_LARGE",
      "That photo is too large. Please upload a photo under 10MB."
    );
  }

  let image = sharp(file, { failOn: "error" });
  let metadata;
  try {
    metadata = await image.metadata();
  } catch (err) {
    throw new TryOnError("INVALID_IMAGE", "That doesn't look like a valid photo. Please try a different file.", err);
  }

  if (!metadata.width || !metadata.height) {
    throw new TryOnError("INVALID_IMAGE", "That doesn't look like a valid photo. Please try a different file.");
  }

  // Very small photos won't produce a usable try-on result.
  if (metadata.width < 300 || metadata.height < 300) {
    throw new TryOnError(
      "LOW_QUALITY_IMAGE",
      "Please upload a clearer, higher-resolution photo and try again."
    );
  }

  const needsResize = metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION;
  const normalized = await image
    .rotate() // auto-orient from EXIF, then strip EXIF on output
    .resize(needsResize ? { width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside" } : undefined)
    .jpeg({ quality: 90 })
    .toBuffer();

  return normalized;
}

/**
 * Prepares the product's existing catalog image for the provider.
 * Product photos are already store assets, so this only normalizes format —
 * it does not re-crop or reinterpret the jewelry. If a variant image already
 * has a transparent PNG background, that transparency is preserved; if it
 * has a photographed background, most jewelry try-on providers isolate the
 * item themselves (that's the point of a jewelry-specific API) rather than
 * needing us to segment it first.
 */
export async function normalizeProductImage(file: Buffer, mimeType: string): Promise<Buffer> {
  if (mimeType === "image/png") {
    // Keep PNG (and any alpha channel) as-is aside from a light size cap.
    return sharp(file).resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside" }).png().toBuffer();
  }
  return sharp(file).resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside" }).jpeg({ quality: 95 }).toBuffer();
}

/**
 * Uploaded photos and generated results are ephemeral by default (see
 * README → Privacy). This helper is the single place that decides the
 * storage key/TTL so it's easy to audit. Wire `putObject`/`deleteObject` to
 * whatever object storage your host app already uses (S3, R2, Vercel Blob,
 * etc.) — kept storage-agnostic here on purpose.
 */
export function buildEphemeralStorageKey(prefix: "upload" | "result"): { key: string; ttlSeconds: number } {
  return {
    key: `tryon/${prefix}/${randomUUID()}`,
    ttlSeconds: 60 * 60, // delete after 1 hour regardless of whether the request completed
  };
}
