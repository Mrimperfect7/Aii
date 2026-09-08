"use client";

import { useRef, useState } from "react";
import { TryOnProduct, TryOnResult } from "@/lib/tryon/types";
import { trackTryOnEvent } from "@/analytics/tryOnEvents";

export function ResultScreen({
  result,
  product,
  onTryAnother,
  onShare,
  onClose,
}: {
  result: TryOnResult;
  product: TryOnProduct;
  onTryAnother: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  }

  async function handleShare() {
    onShare();
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: result.resultImageUrl });
      } else {
        await navigator.clipboard.writeText(result.resultImageUrl);
      }
    } catch {
      // Share cancelled by user — not an error.
    }
  }

  function handleAddToCart() {
    trackTryOnEvent({ name: "add_to_cart_after_tryon", productId: product.id, variantId: product.variantId });
    // Delegate to the host app's existing add-to-cart handler/event, e.g.:
    // window.dispatchEvent(new CustomEvent("shynish:add-to-cart", { detail: { productId: product.id, variantId: product.variantId } }));
    onClose();
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <p className="mb-3 text-sm text-[var(--tryon-muted)]">Your AI Try-On</p>

      <div ref={containerRef} className="relative overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showingOriginal ? result.originalImageUrl : result.resultImageUrl}
          alt={showingOriginal ? "Original photo" : `${product.name} try-on result`}
          onDoubleClick={() => setZoomed((z) => !z)}
          className={`w-full transition-transform duration-300 ${zoomed ? "scale-150" : "scale-100"}`}
        />

        <div className="absolute bottom-3 right-3 flex gap-2">
          <IconButton label="Zoom" onClick={() => setZoomed((z) => !z)}>
            <ZoomIcon />
          </IconButton>
          <IconButton label="Fullscreen" onClick={toggleFullscreen}>
            <ExpandIcon />
          </IconButton>
        </div>
      </div>

      <button
        onClick={() => setShowingOriginal((s) => !s)}
        className="mt-3 self-center text-xs text-[var(--tryon-muted)] underline underline-offset-4"
      >
        {showingOriginal ? "Show Try-On" : "Compare with Original"}
      </button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--tryon-muted)]">
        AI-generated preview. Actual appearance may vary slightly depending on lighting, angle and image quality.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onTryAnother} className="rounded-full border border-white/15 py-3 text-sm">
          Try Another
        </button>
        <button onClick={handleShare} className="rounded-full border border-white/15 py-3 text-sm">
          Share
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        className="mt-3 w-full rounded-full bg-[var(--tryon-accent)] py-3 text-sm font-medium text-[var(--tryon-bg)]"
      >
        Add to Cart
      </button>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
    >
      {children}
    </button>
  );
}

function ZoomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
