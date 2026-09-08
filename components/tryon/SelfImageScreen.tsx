"use client";

import { useRef, useState } from "react";
import { JewelryCategory } from "@/lib/tryon/types";
import { getCategoryConfig } from "@/lib/tryon/categoryConfig";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

export function SelfImageScreen({
  category,
  onBack,
  onGenerate,
}: {
  category: JewelryCategory;
  onBack: () => void;
  onGenerate: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { captureHint } = getCategoryConfig(category);

  function handleFile(selected: File | null) {
    setValidationError(null);
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setValidationError("Please upload a JPG, PNG, or WebP photo.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setValidationError("That photo is too large. Please upload a photo under 10MB.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <button onClick={onBack} className="mb-4 self-start text-xs text-[var(--tryon-muted)] hover:text-[var(--tryon-text)]">
        ← Back
      </button>

      {!previewUrl && (
        <>
          <p className="mb-2 text-sm text-[var(--tryon-muted)]">{captureHint}</p>

          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full rounded-2xl border border-white/10 bg-[var(--tryon-surface)] py-4 text-sm font-medium"
            >
              Upload a photo
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full rounded-2xl border border-white/10 bg-[var(--tryon-surface)] py-4 text-sm font-medium"
            >
              Use camera
            </button>
          </div>

          {validationError && <p className="mt-3 text-xs text-[var(--tryon-danger)]">{validationError}</p>}

          <input
            ref={galleryInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            capture="user"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </>
      )}

      {previewUrl && (
        <div className="flex flex-1 flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Your photo" className="max-h-80 w-full rounded-2xl object-cover" />

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="flex-1 rounded-full border border-white/15 py-3 text-sm"
            >
              Choose another
            </button>
            <button
              onClick={() => file && onGenerate(file)}
              className="flex-1 rounded-full bg-[var(--tryon-accent)] py-3 text-sm font-medium text-[var(--tryon-bg)]"
            >
              Generate Try-On
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
