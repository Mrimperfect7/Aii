import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getTryOnProvider, getTryOnTimeoutMs } from "@/lib/tryon/provider";
import { getCategoryConfig } from "@/lib/tryon/categoryConfig";
import { getCharacterById } from "@/lib/tryon/characters";
import { preprocessUpload, normalizeProductImage, buildEphemeralStorageKey } from "@/lib/tryon/imagePreprocess";
import { checkRateLimit, dedupeInFlight } from "@/lib/tryon/rateLimit";
import { TryOnError, TryOnProduct, TryOnMode } from "@/lib/tryon/types";
// Swap for your project's actual object storage helpers (S3 / R2 / Vercel Blob / etc).
import { putEphemeralObject, resolveToPublicUrl } from "@/lib/tryon/storageAdapter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = randomUUID();

  try {
    // --- Rate limiting -----------------------------------------------
    const clientKey = req.headers.get("x-forwarded-for") || req.ip || "anonymous";
    if (!checkRateLimit(clientKey)) {
      throw new TryOnError("RATE_LIMITED", "Try-On is experiencing high demand right now. Please try again shortly.");
    }

    // --- Parse input ---------------------------------------------------
    const form = await req.formData();
    const mode = form.get("mode") as TryOnMode | null;
    const productRaw = form.get("product") as string | null;

    if (!mode || (mode !== "character" && mode !== "self")) {
      return errorResponse(new TryOnError("UNKNOWN", "Something went wrong. Please try again."), requestId);
    }
    if (!productRaw) {
      throw new TryOnError("MISSING_PRODUCT_IMAGE", "We couldn't find this product's image. Please refresh and try again.");
    }

    const product = JSON.parse(productRaw) as TryOnProduct;
    if (!product.imageUrl) {
      throw new TryOnError("MISSING_PRODUCT_IMAGE", "We couldn't find this product's image. Please refresh and try again.");
    }

    const categoryConfig = getCategoryConfig(product.category); // throws UNSUPPORTED_CATEGORY-equivalent if unknown

    // --- Resolve the wearer image (character asset or fresh upload) ---
    let wearerImageUrl: string;
    let originalImageUrl: string;
    let dedupeKey: string;

    if (mode === "character") {
      const characterId = form.get("characterId") as string | null;
      const character = characterId ? getCharacterById(characterId) : undefined;
      if (!character) {
        return errorResponse(new TryOnError("UNKNOWN", "Please choose a character and try again."), requestId);
      }
      wearerImageUrl = resolveToPublicUrl(character.baseImageUrl);
      originalImageUrl = wearerImageUrl;
      dedupeKey = `${clientKey}:${product.id}:${product.variantId}:character:${character.id}`;
    } else {
      const file = form.get("image") as File | null;
      if (!file) {
        throw new TryOnError("INVALID_IMAGE", "Please upload a photo to continue.");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const processed = await preprocessUpload(buffer, file.type);

      const { key, ttlSeconds } = buildEphemeralStorageKey("upload");
      const stored = await putEphemeralObject(key, processed, "image/jpeg", ttlSeconds);
      wearerImageUrl = stored.url;
      originalImageUrl = stored.url;
      dedupeKey = `${clientKey}:${product.id}:${product.variantId}:self:${key}`;
    }

    // --- Normalize the product image (server-controlled, never edited by client) ---
    const productImageUrl = product.imageUrl; // already a CDN URL from the catalog; re-encoding happens provider-side if needed

    // --- Call the provider (deduped) -----------------------------------
    const result = await dedupeInFlight(dedupeKey, async () => {
      const provider = getTryOnProvider();
      return provider.generate({
        category: product.category,
        productImageUrl,
        wearerImageUrl,
        timeoutMs: getTryOnTimeoutMs(),
      });
    });

    const now = Date.now();
    return NextResponse.json({
      requestId,
      resultImageUrl: result.resultImageUrl,
      originalImageUrl,
      product: { id: product.id, name: product.name, category: product.category, variantId: product.variantId },
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

function errorResponse(err: unknown, requestId: string) {
  if (err instanceof TryOnError) {
    const status = err.code === "RATE_LIMITED" ? 429 : err.code === "PROVIDER_TIMEOUT" ? 504 : 422;
    // Log the real error server-side for debugging; only userMessage ever reaches the client.
    console.error(`[tryon:${requestId}] ${err.code}`, err.cause ?? err.message);
    return NextResponse.json({ requestId, code: err.code, message: err.userMessage }, { status });
  }

  console.error(`[tryon:${requestId}] UNKNOWN`, err);
  return NextResponse.json(
    { requestId, code: "UNKNOWN", message: "Try-On is temporarily unavailable. Please try again." },
    { status: 500 }
  );
}
