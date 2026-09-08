"use client";

import { useEffect, useState } from "react";
import { JewelryCategory } from "@/lib/tryon/types";

interface CharacterOption {
  id: string;
  label: string;
  thumbnailUrl: string;
  gender: string;
}

export function CharacterSelectScreen({
  category,
  onBack,
  onGenerate,
}: {
  category: JewelryCategory;
  onBack: () => void;
  onGenerate: (characterId: string) => void;
}) {
  const [characters, setCharacters] = useState<CharacterOption[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tryon/characters?category=${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data) => !cancelled && setCharacters(data.characters ?? []))
      .catch(() => !cancelled && setCharacters([]));
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <button onClick={onBack} className="mb-4 self-start text-xs text-[var(--tryon-muted)] hover:text-[var(--tryon-text)]">
        ← Back
      </button>

      <p className="mb-4 text-sm text-[var(--tryon-muted)]">Choose a character</p>

      {characters === null && <div className="grid grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/5" />)}</div>}

      {characters?.length === 0 && (
        <p className="text-sm text-[var(--tryon-muted)]">No characters are available for this jewelry type yet — try uploading your own photo instead.</p>
      )}

      {characters && characters.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                selectedId === c.id ? "border-[var(--tryon-accent)]" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.thumbnailUrl} alt={c.label} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex-1" />

      <button
        disabled={!selectedId}
        onClick={() => selectedId && onGenerate(selectedId)}
        className="mt-4 w-full rounded-full bg-[var(--tryon-accent)] py-3 text-sm font-medium text-[var(--tryon-bg)] disabled:opacity-40"
      >
        Try On
      </button>
    </div>
  );
}
