import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { openai, SUPPORTED_MODELS, DEFAULT_MODEL } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit'
import { isPlanAllowedModel, type PlanName } from '@/lib/plans'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const {
      messages,
      modelId = DEFAULT_MODEL,
    }: { messages: UIMessage[]; modelId: string } = await req.json()

    // Validate model
    if (!SUPPORTED_MODELS.includes(modelId)) {
      return new Response(
        JSON.stringify({ error: `Model ${modelId} nije podržan` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Neautorizirano. Molimo prijavite se.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, user.email!)

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit dostignut. Imate ${rateLimit.remaining}/${rateLimit.limit} poruka preostalo ovaj mjesec. Nadogradite na Pro za unlimited pristup!`,
          rateLimit: {
            remaining: rateLimit.remaining,
            limit: rateLimit.limit,
          },
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user's plan allows the selected model
    if (!rateLimit.isOwner && !isPlanAllowedModel(rateLimit.plan as PlanName, modelId)) {
      return new Response(
        JSON.stringify({
          error: `Vaš ${rateLimit.plan} plan ne uključuje pristup ovom modelu. Nadogradite na Pro za pristup svim modelima!`,
          plan: rateLimit.plan,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert messages
    const modelMessages = await convertToModelMessages(messages)

    // Stream response from OpenAI via Cloudflare Gateway
    const result = streamText({
      model: openai(modelId),
      system: rateLimit.isOwner
        ? `Ti si napredni AI asistent sa unlimited mogućnostima. Vlasnik si ${user.email} i imaš potpuni pristup svim funkcijama.`
        : 'Ti si korisni AI asistent pokrenut GPT-4.',
      messages: modelMessages,
      onFinish: async () => {
        // Increment usage after successful completion
        await incrementUsage(user.id, user.email!)
      },
      onError: (e) => {
        console.error('Greška prilikom streaminga.', e)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error: unknown) {
    console.error('Chat API greška:', error)
    return new Response(
      JSON.stringify({
        error:
          (error as { message: string }).message ||
          'Dogodila se greška prilikom obrade vašeg zahtjeva.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
