import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'
import crypto from 'crypto'

// Setup LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('LemonSqueezy Error:', error),
})

export { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

export interface CreateCheckoutOptions {
  variantId: string
  customerEmail: string
  customData?: Record<string, unknown>
  redirectUrl?: string
}

export async function createCheckoutSession(options: CreateCheckoutOptions) {
  const { createCheckout } = await import('@lemonsqueezy/lemonsqueezy.js')

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!

  const checkoutData: Record<string, unknown> = {
    storeId,
    variantId: options.variantId,
    checkoutData: {
      email: options.customerEmail,
      custom: options.customData,
    },
  }

  if (options.redirectUrl) {
    ;(checkoutData.checkoutData as Record<string, unknown>).redirect_url = options.redirectUrl
  }

  const { data, error } = await createCheckout(storeId, checkoutData as never)

  if (error) {
    throw new Error((error as { message?: string }).message || 'Failed to create checkout')
  }

  return data
}

export enum WebhookEventType {
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_RESUMED = 'subscription_resumed',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  SUBSCRIPTION_PAUSED = 'subscription_paused',
  SUBSCRIPTION_UNPAUSED = 'subscription_unpaused',
  SUBSCRIPTION_PAYMENT_SUCCESS = 'subscription_payment_success',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
}

export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(rawBody).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export function parseWebhookPayload(rawBody: string) {
  return JSON.parse(rawBody)
}
