import { ProviderGenerateInput, ProviderGenerateOutput, TryOnProvider } from "../types";

/**
 * Returns the wearer's original photo unchanged after a simulated delay.
 * Lets you build and demo the entire UI/UX flow — loading states, error
 * states, result screen, analytics — before a real provider key exists.
 * Never use this in production; it does not actually place jewelry.
 */
export class MockProvider implements TryOnProvider {
  readonly name = "mock";

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateOutput> {
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    return {
      resultImageUrl: input.wearerImageUrl,
      providerRequestId: `mock_${Date.now()}`,
    };
  }
}
