import { createGatewayProvider } from "@ai-sdk/gateway";

const baseURL = process.env.AI_GATEWAY_BASE_URL;

if (!baseURL) {
  throw new Error(
    "AI_GATEWAY_BASE_URL environment variable is not set. " +
    "Please configure it in your environment or .env.local file."
  );
}

export const gateway = createGatewayProvider({
  baseURL,
});
