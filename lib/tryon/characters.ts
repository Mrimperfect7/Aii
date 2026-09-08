import { TryOnCharacter } from "./types";

/**
 * The character roster is a static, curated asset library — NOT generated
 * on demand. Generate each base photo once (any general-purpose image
 * model works fine for this, since fidelity constraints only apply to the
 * jewelry, not the character), review it for quality/diversity, upload it
 * to your CDN, and register it here. This keeps "AI Character" try-ons fast
 * (no generation latency, just the same placement call as self-upload) and
 * cheap (pay for placement, not for re-rendering a person every click).
 *
 * Replace the placeholder URLs with your real CDN assets. Keep at least one
 * character with every region visible (ears, neck, hand, wrist, nose) or
 * category selection will filter some characters out — see
 * getCharactersForCategory below.
 */
export const CHARACTER_LIBRARY: TryOnCharacter[] = [
  {
    id: "char-01",
    label: "Character 1",
    thumbnailUrl: "/tryon-characters/char-01-thumb.jpg",
    baseImageUrl: "/tryon-characters/char-01-full.jpg",
    gender: "female",
    skinTone: "deep",
    ageRange: "20s",
    visibleRegions: ["earrings", "necklace", "pendant", "chain", "nose-jewelry"],
  },
  {
    id: "char-02",
    label: "Character 2",
    thumbnailUrl: "/tryon-characters/char-02-thumb.jpg",
    baseImageUrl: "/tryon-characters/char-02-full.jpg",
    gender: "female",
    skinTone: "medium",
    ageRange: "30s",
    visibleRegions: ["earrings", "necklace", "pendant", "chain", "ring", "bracelet", "bangle"],
  },
  {
    id: "char-03",
    label: "Character 3",
    thumbnailUrl: "/tryon-characters/char-03-thumb.jpg",
    baseImageUrl: "/tryon-characters/char-03-full.jpg",
    gender: "female",
    skinTone: "fair",
    ageRange: "40s",
    visibleRegions: ["earrings", "necklace", "pendant", "chain", "nose-jewelry"],
  },
  {
    id: "char-04",
    label: "Character 4",
    thumbnailUrl: "/tryon-characters/char-04-thumb.jpg",
    baseImageUrl: "/tryon-characters/char-04-full.jpg",
    gender: "male",
    skinTone: "medium",
    ageRange: "20s",
    visibleRegions: ["earrings", "necklace", "chain", "ring", "bracelet"],
  },
  {
    id: "char-05",
    label: "Character 5",
    thumbnailUrl: "/tryon-characters/char-05-thumb.jpg",
    baseImageUrl: "/tryon-characters/char-05-full.jpg",
    gender: "male",
    skinTone: "deep",
    ageRange: "30s",
    visibleRegions: ["earrings", "necklace", "chain", "ring", "bracelet"],
  },
  {
    id: "char-06",
    label: "Character 6",
    thumbnailUrl: "/tryon-characters/char-06-thumb.jpg",
    baseImageUrl: "/tryon-characters/char-06-full.jpg",
    gender: "nonbinary",
    skinTone: "fair",
    ageRange: "20s",
    visibleRegions: ["earrings", "necklace", "pendant", "chain", "ring", "bracelet", "bangle", "nose-jewelry"],
  },
];

export function getCharactersForCategory(category: string): TryOnCharacter[] {
  return CHARACTER_LIBRARY.filter((c) => c.visibleRegions.includes(category as any));
}

export function getCharacterById(id: string): TryOnCharacter | undefined {
  return CHARACTER_LIBRARY.find((c) => c.id === id);
}
