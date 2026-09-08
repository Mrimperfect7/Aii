import { JewelryCategory, TryOnErrorCode, TryOnMode } from "@/lib/tryon/types";

/**
 * Thin, typed wrapper around whatever analytics dispatch SHYN.ISH already
 * has wired up (GA4 gtag, Meta Pixel fbq, or a shared trackEvent() helper).
 * Replace the body of track() with a call into that existing infra — do not
 * stand up a second analytics pipeline for this feature.
 *
 * Deliberately collects only what's useful for conversion/UX analysis:
 * product/category/mode and pass/fail outcomes. No image data, no uploaded
 * photo content, no raw error text ever goes through this module.
 */

export type TryOnAnalyticsEvent =
  | { name: "try_on_opened"; productId: string; category: JewelryCategory }
  | { name: "ai_character_selected"; productId: string; characterId: string }
  | { name: "self_image_selected"; productId: string }
  | { name: "image_uploaded"; productId: string }
  | { name: "try_on_generation_started"; productId: string; mode: TryOnMode }
  | { name: "try_on_generation_completed"; productId: string; mode: TryOnMode; durationMs: number }
  | { name: "try_on_generation_failed"; productId: string; mode: TryOnMode; errorCode: TryOnErrorCode }
  | { name: "try_on_shared"; productId: string }
  | { name: "add_to_cart_after_tryon"; productId: string; variantId?: string }
  | { name: "try_another_product"; fromProductId: string };

export function trackTryOnEvent(event: TryOnAnalyticsEvent) {
  const { name, ...params } = event;

  // --- GA4 (window.gtag) ---
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", name, params);
  }

  // --- Meta Pixel (window.fbq) — custom event ---
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("trackCustom", name, params);
  }

  // TODO: if SHYN.ISH has a shared trackEvent()/analytics.ts helper already,
  // call it here instead of duplicating the gtag/fbq calls above.
}
