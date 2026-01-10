import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhook, parseWebhookPayload, WebhookEventType } from '@/lib/lemonsqueezy'

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature')
    const rawBody = await req.text()

    // Verify webhook signature
    if (!verifyWebhook(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = parseWebhookPayload(rawBody)
    const eventName = payload.meta.event_name as WebhookEventType

    const supabase = await createClient()

    // Handle different webhook events
    switch (eventName) {
      case WebhookEventType.SUBSCRIPTION_CREATED:
      case WebhookEventType.SUBSCRIPTION_UPDATED:
      case WebhookEventType.SUBSCRIPTION_RESUMED:
      case WebhookEventType.SUBSCRIPTION_UNPAUSED: {
        const customData = payload.meta.custom_data
        const userId = customData?.userId
        const plan = customData?.plan

        if (userId && plan) {
          // Update user's plan
          await supabase
            .from('ai_chat_korisnici')
            .update({ plan })
            .eq('id', userId)

          // Update or create subscription record
          await supabase.from('ai_chat_subscriptions').upsert({
            user_id: userId,
            lemonsqueezy_subscription_id: payload.data.id,
            plan,
            status: payload.data.attributes.status,
            renewal_date: payload.data.attributes.renews_at,
          })
        }
        break
      }

      case WebhookEventType.SUBSCRIPTION_CANCELLED:
      case WebhookEventType.SUBSCRIPTION_EXPIRED:
      case WebhookEventType.SUBSCRIPTION_PAUSED: {
        const customData = payload.meta.custom_data
        const userId = customData?.userId

        if (userId) {
          // Downgrade to FREE plan
          await supabase
            .from('ai_chat_korisnici')
            .update({ plan: 'FREE' })
            .eq('id', userId)

          // Update subscription status
          await supabase
            .from('ai_chat_subscriptions')
            .update({ status: 'cancelled' })
            .eq('lemonsqueezy_subscription_id', payload.data.id)
        }
        break
      }

      case WebhookEventType.SUBSCRIPTION_PAYMENT_SUCCESS: {
        // Payment succeeded - optionally log or send email
        console.log('Payment success:', payload.data.id)
        break
      }

      case WebhookEventType.SUBSCRIPTION_PAYMENT_FAILED: {
        // Payment failed - optionally notify user
        console.log('Payment failed:', payload.data.id)
        break
      }

      default:
        console.log('Unhandled webhook event:', eventName)
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: (error as { message: string }).message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
