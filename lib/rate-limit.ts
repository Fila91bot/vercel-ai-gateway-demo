import { createClient } from '@/lib/supabase/server'

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jurica.filkovic@gmail.com'

export const PLAN_LIMITS = {
  FREE: 20,
  PRO: -1, // unlimited
  API: -1, // unlimited
  TEAM: -1, // unlimited
} as const

type Plan = keyof typeof PLAN_LIMITS

export async function checkRateLimit(userId: string, userEmail: string): Promise<{
  allowed: boolean
  remaining: number
  limit: number
  isOwner: boolean
  plan: Plan
}> {
  const supabase = await createClient()

  // OWNER OVERRIDE: Owner gets unlimited free access
  if (userEmail === OWNER_EMAIL) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      isOwner: true,
      plan: 'TEAM', // Owner has access to all features
    }
  }

  // Get user's plan
  const { data: user } = await supabase
    .from('ai_chat_korisnici')
    .select('plan')
    .eq('id', userId)
    .single()

  const plan = (user?.plan as Plan) || 'FREE'
  const limit = PLAN_LIMITS[plan]

  // Unlimited plans (PRO, API, TEAM)
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      isOwner: false,
      plan,
    }
  }

  // Get current month's usage
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: usage } = await supabase
    .from('ai_chat_usage')
    .select('message_count, last_reset')
    .eq('user_id', userId)
    .single()

  // No usage record yet - create one
  if (!usage) {
    await supabase.from('ai_chat_usage').insert({
      user_id: userId,
      message_count: 0,
      last_reset: startOfMonth,
    })

    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      isOwner: false,
      plan,
    }
  }

  // Check if we need to reset (new month)
  const lastReset = new Date(usage.last_reset)
  if (lastReset < new Date(startOfMonth)) {
    await supabase
      .from('ai_chat_usage')
      .update({
        message_count: 0,
        last_reset: startOfMonth,
      })
      .eq('user_id', userId)

    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      isOwner: false,
      plan,
    }
  }

  // Check if limit exceeded
  if (usage.message_count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      isOwner: false,
      plan,
    }
  }

  return {
    allowed: true,
    remaining: limit - usage.message_count - 1,
    limit,
    isOwner: false,
    plan,
  }
}

export async function incrementUsage(userId: string, userEmail: string): Promise<void> {
  // Don't increment for owner
  if (userEmail === OWNER_EMAIL) {
    return
  }

  const supabase = await createClient()

  await supabase.rpc('increment_message_count', {
    p_user_id: userId,
  })
}
