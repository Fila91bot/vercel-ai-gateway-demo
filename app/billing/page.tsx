'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PLANS, type PlanName } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckIcon } from 'lucide-react'

export default function BillingPage() {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<PlanName>('FREE')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadUserPlan() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('ai_chat_korisnici')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (data) {
        setCurrentPlan((data.plan as PlanName) || 'FREE')
      }
    }

    loadUserPlan()
  }, [router])

  const handleUpgrade = async (planKey: PlanName) => {
    if (planKey === 'FREE' || planKey === currentPlan) return

    setLoading(true)

    try {
      const plan = PLANS[planKey]

      if (!plan.lemonsqueezy.variantId) {
        alert('Ovaj plan još nije konfiguriran. Dodajte LemonSqueezy Variant ID.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: plan.lemonsqueezy.variantId,
          plan: planKey,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert('Greška prilikom kreiranja checkout sesije')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Greška prilikom kreiranja checkout sesije')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Odaberite pravi plan za vas
          </h1>
          <p className="text-lg text-muted-foreground">
            Počnite besplatno. Nadogradite kada budete spremni.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.entries(PLANS) as [PlanName, (typeof PLANS)[PlanName]][]).map(
            ([key, plan]) => {
              const isCurrent = currentPlan === key
              const isPro = key === 'PRO'
              const isAPI = key === 'API'
              const isTeam = key === 'TEAM'

              return (
                <Card
                  key={key}
                  className={`relative rounded-lg border p-6 ${
                    isPro
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20 md:scale-105'
                      : isAPI
                        ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                        : isTeam
                          ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                          : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  {isPro && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-blue-500 px-3 py-1 rounded-full text-xs font-semibold">
                        NAJPOPULARNIJE
                      </span>
                    </div>
                  )}
                  {isAPI && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-purple-500 px-3 py-1 rounded-full text-xs font-semibold">
                        ZA DEVELOPERE
                      </span>
                    </div>
                  )}
                  {isTeam && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-orange-500 px-3 py-1 rounded-full text-xs font-semibold">
                        ZA TIMOVE
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground"> / mjesec</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(key)}
                    disabled={loading || isCurrent || key === 'FREE'}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                      isCurrent
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : isPro
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : isAPI
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : isTeam
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : key === 'FREE'
                                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {isCurrent
                      ? 'Trenutni plan'
                      : key === 'FREE'
                        ? 'Besplatno'
                        : 'Nadogradi'}
                  </Button>
                </Card>
              )
            }
          )}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Imate pitanja? Kontaktirajte nas na support@example.com</p>
        </div>
      </div>
    </div>
  )
}
