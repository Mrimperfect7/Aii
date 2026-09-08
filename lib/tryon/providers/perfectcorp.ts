import { ProviderGenerateInput, ProviderGenerateOutput, TryOnError, TryOnProvider } from "../types";
import { getCategoryConfig } from "../categoryConfig";

interface PerfectCorpConfig {
  apiUrl: string;
  apiKey: string;
  model?: string;
}

/**
 * Perfect Corp exposes category-specific jewelry try-on endpoints (necklace,
 * earring, ring, bracelet) that take a product image + a wearer photo and
 * return a composited result — this is the closest fit to the spec's
 * category-aware, fidelity-preserving requirement, since it's purpose-built
 * for jewelry rather than a general image model.
 *
 * IMPORTANT: verify the exact endpoint paths, field names, and response
 * shape against Perfect Corp's current API reference and your account's
 * onboarding docs before going live — the shape below follows their
 * documented pattern (REST, Bearer auth, image-by-URL, category routing)
 * but field names can differ by account tier/version. Treat this file as a
 * working starting point, not a verbatim spec.
 */
export class PerfectCorpProvider implements TryOnProvider {
  readonly name = "perfectcorp";
  private config: PerfectCorpConfig;

  constructor(config: PerfectCorpConfig) {
    this.config = config;
  }

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateOutput> {
    const categoryConfig = getCategoryConfig(input.category);
    const endpoint = `${this.config.apiUrl.replace(/\/$/, "")}/v1/tryon/${categoryConfig.providerProductType}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          product_image_url: input.productImageUrl,
          wearer_image_url: input.wearerImageUrl,
          model: this.config.model,
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new TryOnError("PROVIDER_TIMEOUT", "Try-On is taking longer than expected. Please try again.", err);
      }
      throw new TryOnError("NETWORK_ERROR", "We couldn't reach the Try-On service. Please check your connection and try again.", err);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      throw new TryOnError("RATE_LIMITED", "Try-On is experiencing high demand right now. Please try again shortly.");
    }

    if (!response.ok) {
      // Never surface response.body (raw provider error) to the customer.
      throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", await safeText(response));
    }

    const data = await response.json().catch(() => null);
    const resultImageUrl: string | undefined = data?.result_image_url ?? data?.image_url;

    if (!resultImageUrl) {
      if (data?.error === "no_face_detected" || data?.error === "no_body_detected") {
        throw new TryOnError("NO_FACE_OR_BODY_DETECTED", categoryConfig.detectionFailureHint, data);
      }
      throw new TryOnError("PROVIDER_FAILURE", "Try-On is temporarily unavailable. Please try again.", data);
    }

    return {
      resultImageUrl,
      providerRequestId: data?.request_id,
    };
  }
}

async function safeText(response: Response) {
  try {
    return await response.text();
  } catch {
    return null;
  }
}
