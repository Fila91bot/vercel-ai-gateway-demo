import { createOpenAI } from '@ai-sdk/openai'

// Cloudflare AI Gateway setup for caching and analytics
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
const CLOUDFLARE_GATEWAY_ID = process.env.CLOUDFLARE_GATEWAY_ID!

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: `https://gateway.ai.cloudflare.com/v1/${CLOUDFLARE_ACCOUNT_ID}/${CLOUDFLARE_GATEWAY_ID}/openai`,
})

// Supported OpenAI Models
export const GPT_4 = 'gpt-4o'
export const GPT_4_MINI = 'gpt-4o-mini'
export const GPT_35 = 'gpt-3.5-turbo'

export const DEFAULT_MODEL = GPT_4

export const SUPPORTED_MODELS = [GPT_4, GPT_4_MINI, GPT_35]
