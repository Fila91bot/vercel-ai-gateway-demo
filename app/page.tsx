import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Chat } from '@/components/chat'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ modelId: string }>
}) {
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { modelId } = await searchParams
  return <Chat modelId={modelId} />
}
