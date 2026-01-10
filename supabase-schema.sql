-- =============================================
-- AI Chat Platform - Supabase Database Schema
-- =============================================

-- 1. Kreiranje tablice za korisnike
CREATE TABLE IF NOT EXISTS ai_chat_korisnici (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  plan text DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'API', 'TEAM')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dodaj RLS (Row Level Security) politike
ALTER TABLE ai_chat_korisnici ENABLE ROW LEVEL SECURITY;

-- Korisnici mogu vidjeti samo svoje podatke
CREATE POLICY "Users can view own profile"
  ON ai_chat_korisnici FOR SELECT
  USING (auth.uid() = id);

-- Korisnici mogu ažurirati samo svoje podatke
CREATE POLICY "Users can update own profile"
  ON ai_chat_korisnici FOR UPDATE
  USING (auth.uid() = id);

-- 2. Kreiranje tablice za usage tracking
CREATE TABLE IF NOT EXISTS ai_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES ai_chat_korisnici(id) ON DELETE CASCADE,
  message_count integer DEFAULT 0,
  last_reset timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Dodaj RLS politike
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON ai_chat_usage FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Kreiranje tablice za subscriptions
CREATE TABLE IF NOT EXISTS ai_chat_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES ai_chat_korisnici(id) ON DELETE CASCADE,
  lemonsqueezy_subscription_id text,
  plan text CHECK (plan IN ('PRO', 'API', 'TEAM')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  renewal_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Dodaj RLS politike
ALTER TABLE ai_chat_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON ai_chat_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. RPC funkcija za increment message count
CREATE OR REPLACE FUNCTION increment_message_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kreiraj usage record ako ne postoji
  INSERT INTO ai_chat_usage (user_id, message_count, last_reset)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    message_count = ai_chat_usage.message_count + 1,
    updated_at = now();
END;
$$;

-- 5. Automatsko kreiranje user-a u ai_chat_korisnici nakon Auth signup-a
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kreiraj user u ai_chat_korisnici
  INSERT INTO public.ai_chat_korisnici (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FREE'
  );

  -- Kreiraj usage record
  INSERT INTO public.ai_chat_usage (user_id, message_count, last_reset)
  VALUES (NEW.id, 0, now());

  RETURN NEW;
END;
$$;

-- Trigger koji poziva function kada se kreira novi user u auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. Dodaj indekse za performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_korisnici_email ON ai_chat_korisnici(email);
CREATE INDEX IF NOT EXISTS idx_ai_chat_korisnici_plan ON ai_chat_korisnici(plan);
CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_user_id ON ai_chat_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_subscriptions_user_id ON ai_chat_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_subscriptions_status ON ai_chat_subscriptions(status);

-- =============================================
-- Gotovo! Schema je spremna za korištenje
-- =============================================
