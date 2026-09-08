import { TryOnProvider } from "./types";

/**
 * Provider factory. The rest of the app calls getTryOnProvider() and never
 * imports a vendor SDK directly — swapping vendors is an env var change,
 * not a code change.
 *
 * Required env vars (see .env.example):
 *   TRYON_PROVIDER   "perfectcorp" | "mock"   (default: "mock")
 *   TRYON_API_URL    base URL for the provider's API
 *   TRYON_API_KEY    secret key — server-side only, never sent to the client
 *   TRYON_MODEL      optional model/engine identifier some providers require
 *   TRYON_TIMEOUT_MS request timeout in ms (default: 20000)
 */
let cachedProvider: TryOnProvider | null = null;

export function getTryOnProvider(): TryOnProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.TRYON_PROVIDER || "mock";

  switch (providerName) {
    case "perfectcorp": {
      // Lazy import so unrelated providers' code isn't bundled unnecessarily.
      const { PerfectCorpProvider } = require("./providers/perfectcorp");
      cachedProvider = new PerfectCorpProvider({
        apiUrl: requireEnv("TRYON_API_URL"),
        apiKey: requireEnv("TRYON_API_KEY"),
        model: process.env.TRYON_MODEL,
      });
      break;
    }
    case "mock": {
      const { MockProvider } = require("./providers/mock");
      cachedProvider = new MockProvider();
      break;
    }
    default:
      throw new Error(`Unknown TRYON_PROVIDER: "${providerName}"`);
  }

  return cachedProvider!;
}

export function getTryOnTimeoutMs(): number {
  const raw = process.env.TRYON_TIMEOUT_MS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var "${name}" for the configured TRYON_PROVIDER. Check .env.example.`
    );
  }
  return value;
}

/** Only for tests — resets the cached singleton between test runs. */
export function __resetProviderCacheForTests() {
  cachedProvider = null;
}
