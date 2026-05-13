// === Database Types ===

export interface Platoon {
  id: string;
  name: string;
  company: string | null;
  battalion: string | null;
  brigade: string | null;
  installation: string | null;
  state: string;
  logo_url: string | null;
  created_at: string;
}

export interface Squad {
  id: string;
  platoon_id: string;
  name: string;
  callsign: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  clerk_user_id: string;
  platoon_id: string;
  squad_id: string | null;
  role: 'admin' | 'nco' | 'soldier';
  rank: string | null;
  full_name: string;
  email: string;
  duty_position: string | null;
  created_at: string;
}

export type AARStatus = 'active' | 'review' | 'final';

export interface AAR {
  id: string;
  platoon_id: string;
  squad_id: string | null;
  created_by: string;
  mission_date: string | null;
  mission_type: string | null;
  operation_name: string | null;
  unit_designation: string | null;
  location: string | null;
  grid_reference: string | null;
  training_event: string | null;
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
  platoon_id: string;
  email: string;
  role: 'admin' | 'nco' | 'soldier';
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
  | 'opening'        // "Tell me about the mission"
  | 'what_happened'  // Gathering the timeline
  | 'decisions'      // Key decisions and why
  | 'challenges'     // What went wrong, root causes
  | 'wins'           // Sustains — what went right
  | 'actions'        // Improves — action items and ownership
  | 'closing';       // Summary and wrap-up

// === Live AAR State ===

export interface LiveAARState {
  what_was_planned: string;
  what_happened: string;
  why_difference: string;
  sustain_improve: string;
  summary: string;
  mission_type: string;
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
  mission_type: string | null;
  mission_date: string | null;
  similarity: number;
}

// === Auth ===

export interface AuthContext {
  userId: string;
  profile: Profile;
  platoonId: string;
  squadId: string | null;
  role: 'admin' | 'nco' | 'soldier';
}

export interface AARWithActionItems extends AAR {
  action_items: ActionItem[];
  creator_name?: string;
}
