import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/lemonsqueezy'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { variantId, plan } = await req.json()

    if (!variantId || !plan) {
      return NextResponse.json({ error: 'Missing variantId or plan' }, { status: 400 })
    }

    // Create checkout session with LemonSqueezy
    const checkout = await createCheckoutSession({
      variantId,
      customerEmail: user.email!,
      customData: {
        userId: user.id,
        plan,
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`,
    })

    return NextResponse.json({
      checkoutUrl: checkout.data.attributes.url,
    })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: (error as { message: string }).message || 'Failed to create checkout' },
      { status: 500 }
    )
  }
}
