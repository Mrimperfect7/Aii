export function ModeSelect({
  onChooseCharacter,
  onChooseSelf,
}: {
  onChooseCharacter: () => void;
  onChooseSelf: () => void;
}) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4">
      <p className="mb-2 text-center text-sm text-[var(--tryon-muted)]">
        How would you like to try this on?
      </p>

      <button
        onClick={onChooseCharacter}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[var(--tryon-surface)] px-5 py-4 text-left transition-colors hover:border-[var(--tryon-accent)]/60"
      >
        <span className="text-2xl">👩</span>
        <span>
          <span className="block text-sm font-medium">AI Character</span>
          <span className="block text-xs text-[var(--tryon-muted)]">See it on one of our AI models</span>
        </span>
      </button>

      <button
        onClick={onChooseSelf}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[var(--tryon-surface)] px-5 py-4 text-left transition-colors hover:border-[var(--tryon-accent)]/60"
      >
        <span className="text-2xl">📸</span>
        <span>
          <span className="block text-sm font-medium">Try On Myself</span>
          <span className="block text-xs text-[var(--tryon-muted)]">Upload a photo or use your camera</span>
        </span>
      </button>
    </div>
  );
}
