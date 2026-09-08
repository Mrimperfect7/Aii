// Core types shared across the AI Try-On module (server + client).

export type JewelryCategory =
  | "earrings"
  | "necklace"
  | "pendant"
  | "ring"
  | "bracelet"
  | "bangle"
  | "nose-jewelry"
  | "chain";

export type TryOnMode = "character" | "self";

/** Minimal product info the host product page must pass in — no manual entry. */
export interface TryOnProduct {
  id: string;
  name: string;
  category: JewelryCategory;
  imageUrl: string; // currently selected variant's image
  variantId?: string;
  variantLabel?: string; // e.g. "Rose Gold / Size M"
  metalColor?: string;
  price?: number;
  currency?: string;
  productUrl?: string;
}

export interface TryOnCharacter {
  id: string;
  label: string;
  thumbnailUrl: string;
  /** Full-resolution base photo used as the "wearer" image sent to the provider. */
  baseImageUrl: string;
  gender: "female" | "male" | "nonbinary";
  skinTone: string;
  ageRange: string;
  /** Which jewelry regions are visible/usable in this base photo. */
  visibleRegions: JewelryCategory[];
}

export interface TryOnRequest {
  mode: TryOnMode;
  product: TryOnProduct;
  /** Required when mode === "character" */
  characterId?: string;
  /** Required when mode === "self". Opaque handle to a short-lived uploaded image, not a raw data URL. */
  uploadedImageToken?: string;
}

export interface TryOnResult {
  requestId: string;
  resultImageUrl: string;
  originalImageUrl: string; // the character base photo or the user's uploaded photo
  product: Pick<TryOnProduct, "id" | "name" | "category" | "variantId">;
  createdAt: string;
  expiresAt: string; // result + source images are ephemeral, see privacy notes in README
}

export type TryOnErrorCode =
  | "INVALID_IMAGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "NO_FACE_OR_BODY_DETECTED"
  | "LOW_QUALITY_IMAGE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_FAILURE"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "MISSING_PRODUCT_IMAGE"
  | "UNSUPPORTED_CATEGORY"
  | "UNKNOWN";

export class TryOnError extends Error {
  code: TryOnErrorCode;
  /** Safe to show the customer as-is. Never the raw provider/API error. */
  userMessage: string;

  constructor(code: TryOnErrorCode, userMessage: string, cause?: unknown) {
    super(userMessage);
    this.code = code;
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

/**
 * The provider abstraction. Every AI try-on vendor (Perfect Corp, Camweara,
 * an in-house model, a mock) implements this same interface so the rest of
 * the app never depends on a specific vendor's request/response shape.
 */
export interface TryOnProvider {
  readonly name: string;
  generate(input: ProviderGenerateInput): Promise<ProviderGenerateOutput>;
}

export interface ProviderGenerateInput {
  category: JewelryCategory;
  /** Publicly reachable (short-lived, signed) URL to the product's jewelry image. */
  productImageUrl: string;
  /** Publicly reachable (short-lived, signed) URL to the wearer photo — character or self. */
  wearerImageUrl: string;
  timeoutMs: number;
}

export interface ProviderGenerateOutput {
  resultImageUrl: string;
  providerRequestId?: string;
}
