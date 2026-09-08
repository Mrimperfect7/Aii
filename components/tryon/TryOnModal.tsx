"use client";

import { useEffect } from "react";
import { TryOnProduct } from "@/lib/tryon/types";
import { useTryOn } from "@/hooks/useTryOn";
import { ModeSelect } from "./ModeSelect";
import { CharacterSelectScreen } from "./CharacterSelectScreen";
import { SelfImageScreen } from "./SelfImageScreen";
import { ResultScreen } from "./ResultScreen";

export function TryOnModal({ product, onClose }: { product: TryOnProduct; onClose: () => void }) {
  const tryOn = useTryOn(product);

  // Open immediately on mount (button already handled the open decision).
  useEffect(() => {
    tryOn.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Jewelry Try-On"
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--tryon-bg)] text-[var(--tryon-text)]"
      style={
        {
          "--tryon-bg": "#141311",
          "--tryon-text": "#F5F2EC",
          "--tryon-muted": "#A9A29A",
          "--tryon-accent": "#C6A664",
          "--tryon-surface": "#1D1B18",
          "--tryon-danger": "#E2745A",
        } as React.CSSProperties
      }
    >
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
        <h2 className="text-base font-medium tracking-wide">AI Jewelry Try-On</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-[var(--tryon-muted)] transition-colors hover:bg-white/5 hover:text-[var(--tryon-text)]"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-medium">{product.name}</p>
          {product.variantLabel && <p className="text-xs text-[var(--tryon-muted)]">{product.variantLabel}</p>}
          {typeof product.price === "number" && (
            <p className="mt-0.5 text-sm text-[var(--tryon-accent)]">
              {product.currency ?? "₹"}
              {product.price}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        {tryOn.state.status === "mode-select" && (
          <ModeSelect onChooseCharacter={tryOn.chooseCharacterMode} onChooseSelf={tryOn.chooseSelfMode} />
        )}

        {tryOn.state.status === "character-select" && (
          <CharacterSelectScreen
            category={product.category}
            onBack={tryOn.backToModeSelect}
            onGenerate={tryOn.generateWithCharacter}
          />
        )}

        {tryOn.state.status === "self-upload" && (
          <SelfImageScreen
            category={product.category}
            onBack={tryOn.backToModeSelect}
            onGenerate={tryOn.generateWithSelfImage}
          />
        )}

        {tryOn.state.status === "generating" && <GeneratingState />}

        {tryOn.state.status === "result" && (
          <ResultScreen
            result={tryOn.state.result}
            product={product}
            onTryAnother={tryOn.tryAnother}
            onShare={tryOn.share}
            onClose={onClose}
          />
        )}

        {tryOn.state.status === "error" && (
          <ErrorState message={tryOn.state.message} onRetry={tryOn.retry} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--tryon-accent)] border-t-transparent" />
      <p className="text-sm text-[var(--tryon-muted)]">Creating your virtual try-on…</p>
    </div>
  );
}

function ErrorState({ message, onRetry, onClose }: { message: string; onRetry: () => void; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="max-w-sm text-sm text-[var(--tryon-text)]">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-full bg-[var(--tryon-accent)] px-5 py-2.5 text-sm font-medium text-[var(--tryon-bg)]"
        >
          Try again
        </button>
        <button
          onClick={onClose}
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-[var(--tryon-text)]"
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
