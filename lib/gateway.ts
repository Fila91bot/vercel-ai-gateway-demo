import { createGatewayProvider } from "@ai-sdk/gateway";

let gatewayInstance: ReturnType<typeof createGatewayProvider> | null = null;

export function getGateway() {
  if (!gatewayInstance) {
    const baseURL = process.env.AI_GATEWAY_BASE_URL;

    if (!baseURL) {
      throw new Error(
        "AI_GATEWAY_BASE_URL environment variable is not set. " +
        "Please configure it in your environment or .env.local file."
      );
    }

    gatewayInstance = createGatewayProvider({
      baseURL,
    });
  }

  return gatewayInstance;
}

// For backward compatibility, export gateway as a getter
export const gateway = new Proxy({} as ReturnType<typeof createGatewayProvider>, {
  get(_, prop) {
    const gatewayObj = getGateway() as unknown as Record<string, unknown>;
    return gatewayObj[prop as string];
  }
});
