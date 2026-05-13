-- AfterAction Army — Database Schema
-- Squad-level AARs rolling up to Platoon, with vector embeddings for pattern detection

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for semantic search

-- ============================================
-- PLATOONS (parent organization)
-- ============================================
CREATE TABLE platoons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,             -- e.g. "1st Platoon, B Co, 2-506 IN"
  company TEXT,                   -- e.g. "Bravo Company"
  battalion TEXT,                 -- e.g. "2-506 IN"
  brigade TEXT,                   -- e.g. "3BCT, 101st ABN"
  installation TEXT,              -- e.g. "Fort Campbell"
  state TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SQUADS (the primary operating unit for AARs)
-- ============================================
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platoon_id UUID NOT NULL REFERENCES platoons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,             -- e.g. "1st Squad" or "Weapons Squad"
  callsign TEXT,                  -- e.g. "Bandit 1-1"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_squads_platoon_id ON squads(platoon_id);

-- ============================================
-- PROFILES (Soldiers)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  platoon_id UUID REFERENCES platoons(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'soldier' CHECK (role IN ('admin', 'nco', 'soldier')),
  rank TEXT,                      -- e.g. "SSG", "SPC", "1LT"
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  duty_position TEXT,             -- e.g. "Squad Leader", "RTO", "Team Leader"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_profiles_platoon_id ON profiles(platoon_id);
CREATE INDEX idx_profiles_squad_id ON profiles(squad_id);

-- ============================================
-- AARS - Stores the full conversation + structured output
-- ============================================
CREATE TABLE aars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platoon_id UUID NOT NULL REFERENCES platoons(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Mission metadata
  mission_date DATE,
  mission_type TEXT,              -- e.g. "Movement to Contact", "Deliberate Attack", "Defense"
  operation_name TEXT,            -- e.g. "OP Bayonet Fury"
  unit_designation TEXT,          -- e.g. "1st Squad, 1st PLT"
  location TEXT,                  -- e.g. "Training Area 12, Fort Campbell"
  grid_reference TEXT,            -- e.g. "11S NU 123 456"
  training_event TEXT,            -- e.g. "Squad LFX", "PLT FTX", "CTC Rotation"

  -- Structured AAR output (built live during conversation)
  what_was_planned TEXT,
  what_happened TEXT,
  why_difference TEXT,
  sustain_improve TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Conversation history (the debrief dialogue)
  conversation JSONB NOT NULL DEFAULT '[]',

  -- Vector embedding for semantic similarity search
  embedding VECTOR(1536),

  -- Status: active (AAR in progress), review, final
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'final')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aars_platoon_id ON aars(platoon_id);
CREATE INDEX idx_aars_squad_id ON aars(squad_id);
CREATE INDEX idx_aars_created_at ON aars(created_at DESC);
CREATE INDEX idx_aars_status ON aars(status);

-- Vector similarity index for finding related AARs
CREATE INDEX idx_aars_embedding ON aars USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- Full-text search
ALTER TABLE aars ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(summary, '') || ' ' ||
      COALESCE(what_was_planned, '') || ' ' ||
      COALESCE(what_happened, '') || ' ' ||
      COALESCE(why_difference, '') || ' ' ||
      COALESCE(sustain_improve, '') || ' ' ||
      COALESCE(mission_type, '') || ' ' ||
      COALESCE(operation_name, '') || ' ' ||
      COALESCE(unit_designation, '') || ' ' ||
      COALESCE(location, '') || ' ' ||
      COALESCE(training_event, '')
    )
  ) STORED;

CREATE INDEX idx_aars_search ON aars USING GIN(search_vector);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aars_updated_at
  BEFORE UPDATE ON aars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Semantic search function: find similar AARs by embedding
CREATE OR REPLACE FUNCTION match_aars(
  query_embedding VECTOR(1536),
  match_platoon_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  summary TEXT,
  mission_type TEXT,
  mission_date DATE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aars.id,
    aars.summary,
    aars.mission_type,
    aars.mission_date,
    1 - (aars.embedding <=> query_embedding) AS similarity
  FROM aars
  WHERE aars.platoon_id = match_platoon_id
    AND aars.embedding IS NOT NULL
    AND aars.status = 'final'
    AND 1 - (aars.embedding <=> query_embedding) > match_threshold
  ORDER BY aars.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- ACTION ITEMS
-- ============================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aar_id UUID NOT NULL REFERENCES aars(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to TEXT,               -- Duty position: "PSG", "Alpha TL", "RTO"
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  source_section TEXT
);

CREATE INDEX idx_action_items_aar_id ON action_items(aar_id);

-- ============================================
-- INVITES
-- ============================================
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platoon_id UUID NOT NULL REFERENCES platoons(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'soldier' CHECK (role IN ('admin', 'nco', 'soldier')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_email ON invites(email);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE platoons ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aars ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- RLS is a safety net. All writes use service_role key.
CREATE POLICY "platoon_read" ON platoons FOR SELECT
  USING (id IN (SELECT platoon_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "squads_read" ON squads FOR SELECT
  USING (platoon_id IN (SELECT platoon_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "profiles_read" ON profiles FOR SELECT
  USING (platoon_id IN (SELECT platoon_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "aars_read" ON aars FOR SELECT
  USING (platoon_id IN (SELECT platoon_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "action_items_read" ON action_items FOR SELECT
  USING (aar_id IN (SELECT id FROM aars WHERE platoon_id IN (SELECT platoon_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true))));

CREATE POLICY "invites_read" ON invites FOR SELECT
  USING (platoon_id IN (SELECT platoon_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true) AND role IN ('admin', 'nco')));
