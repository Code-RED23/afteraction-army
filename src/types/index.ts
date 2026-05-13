// === Database Types ===

export interface Agency {
  id: string;
  name: string;
  state: string;
  size: string;
  logo_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  clerk_user_id: string;
  agency_id: string;
  role: 'admin' | 'member';
  full_name: string;
  email: string;
  created_at: string;
}

export type AARStatus = 'active' | 'review' | 'final';

export interface AAR {
  id: string;
  agency_id: string;
  created_by: string;
  incident_date: string | null;
  incident_type: string | null;
  unit: string | null;
  location: string | null;
  incident_number: string | null;
  what_was_planned: string | null;
  what_happened: string | null;
  why_difference: string | null;
  sustain_improve: string | null;
  summary: string | null;
  tags: string[];
  status: AARStatus;
  conversation: ConversationMessage[];
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  aar_id: string;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  status: 'open' | 'closed';
  priority: 'high' | 'medium' | 'low';
  source_section: string | null;
}

export interface Invite {
  id: string;
  agency_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted';
  invited_by: string;
  created_at: string;
}

// === Conversation Types ===

export interface ConversationMessage {
  id: string;
  role: 'chief' | 'user';
  content: string;
  timestamp: number;
  phase?: DebriefPhase;
}

export type DebriefPhase =
  | 'opening'        // "Tell me about the incident"
  | 'what_happened'  // Gathering facts
  | 'decisions'      // Key decisions and why
  | 'challenges'     // What went wrong, root causes
  | 'wins'           // What went well
  | 'actions'        // Action items and ownership
  | 'closing';       // Summary and wrap-up

// === Live AAR State ===

export interface LiveAARState {
  what_was_planned: string;
  what_happened: string;
  why_difference: string;
  sustain_improve: string;
  summary: string;
  incident_type: string;
  tags: string[];
  action_items: {
    description: string;
    priority: 'high' | 'medium' | 'low';
    assigned_to: string | null;
    source_section: string;
  }[];
}

// === Insight Types ===

export interface Pattern {
  id: string;
  theme: string;
  description: string;
  frequency: number;
  aar_ids: string[];
  severity: 'critical' | 'notable' | 'informational';
  first_seen: string;
  last_seen: string;
}

export interface SimilarAAR {
  id: string;
  summary: string;
  incident_type: string | null;
  incident_date: string | null;
  similarity: number;
}

// === Auth ===

export interface AuthContext {
  userId: string;
  profile: Profile;
  agencyId: string;
  role: 'admin' | 'member';
}

export interface AARWithActionItems extends AAR {
  action_items: ActionItem[];
  creator_name?: string;
}
