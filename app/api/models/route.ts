import { NextResponse } from 'next/server'
import { GPT_4, GPT_4_MINI, GPT_35 } from '@/lib/openai'

export async function GET() {
  try {
    const models = [
      {
        id: GPT_4,
        label: 'GPT-4o (Najnoviji)',
      },
      {
        id: GPT_4_MINI,
        label: 'GPT-4o Mini (Brži)',
      },
      {
        id: GPT_35,
        label: 'GPT-3.5 Turbo (Budget)',
      },
    ]

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching available models:', error)
    return NextResponse.json({ error: 'Failed to fetch available models' }, { status: 500 })
  }
}
