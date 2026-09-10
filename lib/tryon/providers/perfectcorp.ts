import { ProviderGenerateInput, ProviderGenerateOutput, TryOnError, TryOnProvider } from "../types";
import { getCategoryConfig } from "../categoryConfig";

interface PerfectCorpConfig {
  apiUrl: string;
  apiKey: string;
  model?: string;
}

const POLL_INTERVAL_MS = 2000;

/**
 * Perfect Corp's actual 2D jewelry Virtual Try-On API — verified against
 * their published OpenAPI specs (docs.perfectcorp.com/reference/ring_vto
 * and /reference/ai_necklace) rather than guessed, unlike the first draft
 * of this file.
 *
 * Confirmed facts (from the real spec, not inferred):
 *  - Base server: https://yce-api-01.makeupar.com
 *  - It's a 2D-image-to-VTO pipeline on purpose — Perfect Corp's own docs:
 *    "Create realistic virtual try-on from a 2D image, no expensive 3D
 *    modelling required." So the product photo you already have is exactly
 *    the right input — never a 3D model.
 *  - The API is ASYNCHRONOUS: POST creates a task and returns a task_id,
 *    then you poll a GET endpoint until task_status is "success" or "error".
 *  - Endpoint pattern verified for ring AND necklace:
 *      POST /s2s/v2.0/task/2d-vto/{category}
 *      GET  /s2s/v2.0/task/2d-vto/{category}/{task_id}
 *    "bracelet" and "earring" below follow the same pattern by strong
 *    analogy (both appear as category slugs elsewhere in Perfect Corp's
 *    docs) but weren't individually re-fetched and confirmed the way ring
 *    and necklace were — worth a quick sanity check against
 *    docs.perfectcorp.com/reference/ai_bracelet and /ai_earrings once you
 *    have a key, before relying on them in production.
 *  - "nose-jewelry" has NO Perfect Corp equivalent at all — they don't
 *    offer a nose jewelry try-on category. Calling this provider with that
 *    category throws UNSUPPORTED_CATEGORY below rather than silently
 *    failing against a made-up endpoint.
 */
export class PerfectCorpProvider implements TryOnProvider {
  readonly name = "perfectcorp";
  private config: PerfectCorpConfig;

  constructor(config: PerfectCorpConfig) {
    this.config = config;
  }

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateOutput> {
    if (input.category === "nose-jewelry") {
      throw new TryOnError(
        "UNSUPPORTED_CATEGORY",
        "Try-On isn't available for this jewelry type yet.",
        "Perfect Corp has no nose-jewelry VTO endpoint"
      );
    }

    const categoryConfig = getCategoryConfig(input.category);
    const category = categoryConfig.providerProductType; // "ring" | "necklace" | "bracelet" | "earring"
    const base = this.config.apiUrl.replace(/\/$/, "");
    const deadline = Date.now() + input.timeoutMs;

    const taskId = await this.createTask(base, category, input, deadline);
    return this.pollUntilDone(base, category, taskId, deadline);
  }

  private async createTask(
    base: string,
    category: string,
    input: ProviderGenerateInput,
    deadline: number
  ): Promise<string> {
    const res = await this.fetchWithDeadline(
      `${base}/s2s/v2.0/task/2d-vto/${category}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({
          // Wearer photo (character asset or the customer's upload) — the VTO target.
          src_file_url: input.wearerImageUrl,
          // The actual product photo. Perfect Corp applies this AS-IS onto the
          // wearer photo rather than regenerating it — this is what preserves
          // exact product fidelity (no hallucinated jewelry).
          ref_file_urls: [input.productImageUrl],
        }),
      },
      deadline
    );

    if (res.status === 429) {
      throw new TryOnError("RATE_LIMITED", "Try-On is experiencing high demand right now. Please try again shortly.");
    }
    if (!res.ok) {
      const body = await safeJson(res);
      if (body?.error_code === "InvalidParameters") {
        throw new TryOnError("INVALID_IMAGE", "Please upload a clearer, well-lit photo and try again.", body);
      }
      throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", body);
    }

    const body = await safeJson(res);
    const taskId = body?.data?.task_id;
    if (!taskId) {
      throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", body);
    }
    return taskId;
  }

  private async pollUntilDone(
    base: string,
    category: string,
    taskId: string,
    deadline: number
  ): Promise<ProviderGenerateOutput> {
    const categoryConfig = getCategoryConfig(category as any);

    while (true) {
      if (Date.now() >= deadline) {
        throw new TryOnError("PROVIDER_TIMEOUT", "Try-On is taking longer than expected. Please try again.");
      }

      const res = await this.fetchWithDeadline(
        `${base}/s2s/v2.0/task/2d-vto/${category}/${taskId}`,
        { method: "GET", headers: { Authorization: `Bearer ${this.config.apiKey}` } },
        deadline
      );

      if (!res.ok) {
        throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", await safeText(res));
      }

      const body = await safeJson(res);
      const status: string | undefined = body?.data?.task_status;

      if (status === "success") {
        // Response shape for `results` isn't fully pinned down in the public
        // spec (documented inconsistently) — handle it as either a single
        // object or an array defensively.
        const results = body?.data?.results;
        const resultUrl: string | undefined = Array.isArray(results) ? results[0]?.url : results?.url;
        if (!resultUrl) {
          throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", body);
        }
        return { resultImageUrl: resultUrl, providerRequestId: taskId };
      }

      if (status === "error") {
        const engineError: string | undefined = body?.data?.error;
        if (engineError === "error_no_face" || engineError === "error_pose") {
          throw new TryOnError("NO_FACE_OR_BODY_DETECTED", categoryConfig.detectionFailureHint, body);
        }
        throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", body);
      }

      // status === "running" (or unset) — wait and poll again.
      await sleep(Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())));
    }
  }

  private async fetchWithDeadline(url: string, init: RequestInit, deadline: number): Promise<Response> {
    const controller = new AbortController();
    const msLeft = Math.max(0, deadline - Date.now());
    const timeout = setTimeout(() => controller.abort(), msLeft);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new TryOnError("PROVIDER_TIMEOUT", "Try-On is taking longer than expected. Please try again.", err);
      }
      throw new TryOnError("NETWORK_ERROR", "We couldn't reach the Try-On service. Please check your connection and try again.", err);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}
