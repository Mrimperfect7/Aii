"use client";

import { Suspense, lazy, useState } from "react";
import { TryOnProduct } from "@/lib/tryon/types";

// Lazy-loaded so the AI Try-On UI (and its dependencies) never delay the
// product page's own first paint or interactivity.
const TryOnModal = lazy(() => import("./TryOnModal").then((m) => ({ default: m.TryOnModal })));

export function TryOnButton({ product, className }: { product: TryOnProduct; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full border border-[var(--tryon-accent)] px-5 py-2.5 text-sm tracking-wide text-[var(--tryon-accent)] transition-colors hover:bg-[var(--tryon-accent)] hover:text-[var(--tryon-bg)]"
        }
      >
        <SparkleIcon />
        AI Try On
      </button>

      {open && (
        <Suspense fallback={null}>
          <TryOnModal product={product} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4L8 1z"
        fill="currentColor"
      />
    </svg>
  );
}
