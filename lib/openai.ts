import { createOpenAI } from '@ai-sdk/openai'

// Direct OpenAI connection (no gateway)
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Supported OpenAI Models
export const GPT_4 = 'gpt-4o'
export const GPT_4_MINI = 'gpt-4o-mini'
export const GPT_35 = 'gpt-3.5-turbo'

export const DEFAULT_MODEL = GPT_4

export const SUPPORTED_MODELS = [GPT_4, GPT_4_MINI, GPT_35]
