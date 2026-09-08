"use client";

import { useCallback, useRef, useState } from "react";
import { TryOnMode, TryOnProduct, TryOnResult, TryOnErrorCode } from "@/lib/tryon/types";
import { trackTryOnEvent } from "@/analytics/tryOnEvents";

type TryOnState =
  | { status: "closed" }
  | { status: "mode-select" }
  | { status: "character-select" }
  | { status: "self-upload" }
  | { status: "generating"; mode: TryOnMode }
  | { status: "result"; result: TryOnResult; mode: TryOnMode }
  | { status: "error"; mode: TryOnMode; errorCode: TryOnErrorCode; message: string };

const GENERATE_ENDPOINT = "/api/tryon/generate";

export function useTryOn(product: TryOnProduct) {
  const [state, setState] = useState<TryOnState>({ status: "closed" });
  const inFlightRef = useRef(false); // client-side guard against double-submits

  const open = useCallback(() => {
    trackTryOnEvent({ name: "try_on_opened", productId: product.id, category: product.category });
    setState({ status: "mode-select" });
  }, [product.id, product.category]);

  const close = useCallback(() => setState({ status: "closed" }), []);

  const chooseCharacterMode = useCallback(() => setState({ status: "character-select" }), []);
  const chooseSelfMode = useCallback(() => {
    trackTryOnEvent({ name: "self_image_selected", productId: product.id });
    setState({ status: "self-upload" });
  }, [product.id]);

  const backToModeSelect = useCallback(() => setState({ status: "mode-select" }), []);

  const generateWithCharacter = useCallback(
    async (characterId: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      trackTryOnEvent({ name: "ai_character_selected", productId: product.id, characterId });
      await runGenerate("character", { characterId });
      inFlightRef.current = false;
    },
    [product] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const generateWithSelfImage = useCallback(
    async (file: File) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      trackTryOnEvent({ name: "image_uploaded", productId: product.id });
      await runGenerate("self", { file });
      inFlightRef.current = false;
    },
    [product] // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function runGenerate(mode: TryOnMode, extra: { characterId?: string; file?: File }) {
    const startedAt = Date.now();
    setState({ status: "generating", mode });
    trackTryOnEvent({ name: "try_on_generation_started", productId: product.id, mode });

    const form = new FormData();
    form.set("mode", mode);
    form.set("product", JSON.stringify(product));
    if (extra.characterId) form.set("characterId", extra.characterId);
    if (extra.file) form.set("image", extra.file);

    try {
      const res = await fetch(GENERATE_ENDPOINT, { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        const errorCode: TryOnErrorCode = data.code || "UNKNOWN";
        trackTryOnEvent({ name: "try_on_generation_failed", productId: product.id, mode, errorCode });
        setState({ status: "error", mode, errorCode, message: data.message || "Try-On is temporarily unavailable. Please try again." });
        return;
      }

      trackTryOnEvent({
        name: "try_on_generation_completed",
        productId: product.id,
        mode,
        durationMs: Date.now() - startedAt,
      });
      setState({ status: "result", result: data as TryOnResult, mode });
    } catch {
      trackTryOnEvent({ name: "try_on_generation_failed", productId: product.id, mode, errorCode: "NETWORK_ERROR" });
      setState({
        status: "error",
        mode,
        errorCode: "NETWORK_ERROR",
        message: "We couldn't reach Try-On. Please check your connection and try again.",
      });
    }
  }

  const retry = useCallback(() => {
    if (state.status !== "error") return;
    setState(state.mode === "character" ? { status: "character-select" } : { status: "self-upload" });
  }, [state]);

  const tryAnother = useCallback(() => {
    if (state.status !== "result") return;
    setState(state.mode === "character" ? { status: "character-select" } : { status: "self-upload" });
  }, [state]);

  const share = useCallback(() => {
    trackTryOnEvent({ name: "try_on_shared", productId: product.id });
  }, [product.id]);

  return {
    state,
    open,
    close,
    chooseCharacterMode,
    chooseSelfMode,
    backToModeSelect,
    generateWithCharacter,
    generateWithSelfImage,
    retry,
    tryAnother,
    share,
  };
}
