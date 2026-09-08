import { JewelryCategory } from "./types";

/**
 * Placement + validation rules per category. Keeping this centralized means
 * adding a new jewelry category (e.g. "anklet") is a one-place change, not a
 * hunt through UI, API, and provider code.
 */
export interface CategoryConfig {
  category: JewelryCategory;
  label: string;
  /** Anatomical region the provider needs visible in the wearer photo. */
  requiredRegion: "ears" | "neck-chest" | "hand-finger" | "wrist" | "nose";
  /** Shown to the user before upload so they frame the shot correctly. */
  captureHint: string;
  /** Shown when NO_FACE_OR_BODY_DETECTED fires for this category. */
  detectionFailureHint: string;
  /** Perfect Corp (or any provider) product-type routing key — see provider file. */
  providerProductType: string;
}

export const CATEGORY_CONFIG: Record<JewelryCategory, CategoryConfig> = {
  earrings: {
    category: "earrings",
    label: "Earrings",
    requiredRegion: "ears",
    captureHint: "Face the camera with at least one ear visible, hair pulled back if possible.",
    detectionFailureHint: "We couldn't find a clear ear in that photo. Try pulling your hair back and facing the camera directly.",
    providerProductType: "earring",
  },
  necklace: {
    category: "necklace",
    label: "Necklace",
    requiredRegion: "neck-chest",
    captureHint: "Show your neck and upper chest clearly, collar or off-shoulder tops work best.",
    detectionFailureHint: "We couldn't find a clear neckline in that photo. Try a photo that shows your neck and upper chest.",
    providerProductType: "necklace",
  },
  pendant: {
    category: "pendant",
    label: "Pendant",
    requiredRegion: "neck-chest",
    captureHint: "Show your neck and upper chest clearly, collar or off-shoulder tops work best.",
    detectionFailureHint: "We couldn't find a clear neckline in that photo. Try a photo that shows your neck and upper chest.",
    providerProductType: "necklace",
  },
  chain: {
    category: "chain",
    label: "Chain",
    requiredRegion: "neck-chest",
    captureHint: "Show your neck and upper chest clearly, collar or off-shoulder tops work best.",
    detectionFailureHint: "We couldn't find a clear neckline in that photo. Try a photo that shows your neck and upper chest.",
    providerProductType: "necklace",
  },
  ring: {
    category: "ring",
    label: "Ring",
    requiredRegion: "hand-finger",
    captureHint: "Hold your hand flat and relaxed, palm side down, fingers slightly spread.",
    detectionFailureHint: "We couldn't find a clear hand in that photo. Try a flat, well-lit photo of your hand.",
    providerProductType: "ring",
  },
  bracelet: {
    category: "bracelet",
    label: "Bracelet",
    requiredRegion: "wrist",
    captureHint: "Show your wrist clearly, sleeves pushed up.",
    detectionFailureHint: "We couldn't find a clear wrist in that photo. Try a photo with your sleeve pushed up.",
    providerProductType: "bracelet",
  },
  bangle: {
    category: "bangle",
    label: "Bangle",
    requiredRegion: "wrist",
    captureHint: "Show your wrist clearly, sleeves pushed up.",
    detectionFailureHint: "We couldn't find a clear wrist in that photo. Try a photo with your sleeve pushed up.",
    providerProductType: "bracelet",
  },
  "nose-jewelry": {
    category: "nose-jewelry",
    label: "Nose Jewelry",
    requiredRegion: "nose",
    captureHint: "Face the camera directly in good light so your nose is clearly visible.",
    detectionFailureHint: "We couldn't find a clear face in that photo. Try facing the camera directly in good light.",
    providerProductType: "nose",
  },
};

export function getCategoryConfig(category: JewelryCategory): CategoryConfig {
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    throw new Error(`Unsupported jewelry category: ${category}`);
  }
  return config;
}
