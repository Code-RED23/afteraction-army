-- AfterAction AI V2 - Database Schema
-- Conversational debrief model with vector embeddings for pattern detection

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for semantic search

-- ============================================
-- AGENCIES
-- ============================================
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT 'small',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_profiles_agency_id ON profiles(agency_id);

-- ============================================
-- AARS - Now stores the full conversation + structured output
-- ============================================
CREATE TABLE aars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Incident metadata
  incident_date DATE,
  incident_type TEXT,
  unit TEXT,
  location TEXT,
  incident_number TEXT,

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

  -- Status: active (debrief in progress), review, final
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'final')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aars_agency_id ON aars(agency_id);
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
      COALESCE(incident_type, '') || ' ' ||
      COALESCE(unit, '') || ' ' ||
      COALESCE(location, '')
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
  match_agency_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  summary TEXT,
  incident_type TEXT,
  incident_date DATE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aars.id,
    aars.summary,
    aars.incident_type,
    aars.incident_date,
    1 - (aars.embedding <=> query_embedding) AS similarity
  FROM aars
  WHERE aars.agency_id = match_agency_id
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
  assigned_to TEXT,
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
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_email ON invites(email);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aars ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- RLS is a safety net. All writes use service_role key.
CREATE POLICY "agency_read" ON agencies FOR SELECT
  USING (id IN (SELECT agency_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "profiles_read" ON profiles FOR SELECT
  USING (agency_id IN (SELECT agency_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "aars_read" ON aars FOR SELECT
  USING (agency_id IN (SELECT agency_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true)));

CREATE POLICY "action_items_read" ON action_items FOR SELECT
  USING (aar_id IN (SELECT id FROM aars WHERE agency_id IN (SELECT agency_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true))));

CREATE POLICY "invites_read" ON invites FOR SELECT
  USING (agency_id IN (SELECT agency_id FROM profiles WHERE clerk_user_id = current_setting('app.clerk_user_id', true) AND role = 'admin'));
