// LemonSqueezy Plan Configuration
// IMPORTANT: Replace these with your actual LemonSqueezy Product and Variant IDs
// Get them from: https://app.lemonsqueezy.com/products

import { GPT_4, GPT_4_MINI, GPT_35 } from './openai'

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceDisplay: '0€',
    messageLimit: 20,
    allowedModels: [GPT_35], // Only GPT-3.5 Turbo
    features: [
      '20 poruka mjesečno',
      '1 model (GPT-3.5 Turbo)',
      'Bez API pristupa',
      'Bez gateway optimizacija',
    ],
    lemonsqueezy: {
      productId: null, // FREE plan doesn't need LemonSqueezy
      variantId: null,
    },
  },
  PRO: {
    name: 'Pro',
    price: 1900, // 19€ in cents
    priceDisplay: '19€',
    messageLimit: -1, // unlimited
    allowedModels: [GPT_4, GPT_4_MINI, GPT_35], // All 3 models
    features: [
      'Unlimited poruke',
      'Sva 3 modela (GPT-4o, GPT-4o Mini, GPT-3.5 Turbo)',
      'Brži response priority',
      'Cloudflare Gateway optimizacije',
      'Early access na nove feature-e',
    ],
    lemonsqueezy: {
      productId: 'YOUR_PRODUCT_ID_HERE', // ← Replace with actual Product ID
      variantId: 'YOUR_VARIANT_ID_HERE', // ← Replace with actual Variant ID
    },
  },
  API: {
    name: 'API / Developer',
    price: 2900, // 29€ in cents
    priceDisplay: '29€',
    messageLimit: -1, // unlimited
    allowedModels: [GPT_4, GPT_4_MINI, GPT_35], // All models
    features: [
      'Sve iz PRO',
      'API ključ + unlimited API pozivi',
      'Usage analytics',
      'Model switching preko API-ja',
      'Idealno za developere i integracije',
    ],
    lemonsqueezy: {
      productId: 'YOUR_PRODUCT_ID_HERE', // ← Replace with actual Product ID
      variantId: 'YOUR_VARIANT_ID_HERE', // ← Replace with actual Variant ID
    },
  },
  TEAM: {
    name: 'Team / Studio',
    price: 4900, // 49€ in cents
    priceDisplay: '49€',
    messageLimit: -1, // unlimited
    allowedModels: [GPT_4, GPT_4_MINI, GPT_35], // All models
    features: [
      'Sve iz API plana',
      '3 korisnika uključena',
      'Shared usage analytics',
      'Centralizirani billing',
      'Prioritetna podrška',
    ],
    lemonsqueezy: {
      productId: 'YOUR_PRODUCT_ID_HERE', // ← Replace with actual Product ID
      variantId: 'YOUR_VARIANT_ID_HERE', // ← Replace with actual Variant ID
    },
  },
} as const

export type PlanName = keyof typeof PLANS

// Helper function to check if a plan allows a specific model
export function isPlanAllowedModel(plan: PlanName, modelId: string): boolean {
  return PLANS[plan].allowedModels.includes(modelId as never)
}
