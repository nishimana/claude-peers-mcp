// Unique ID for each Claude Code instance (generated on registration)
export type PeerId = string;

export interface Peer {
  id: PeerId;
  pid: number;
  cwd: string;
  git_root: string | null;
  tty: string | null;
  summary: string;
  registered_at: string; // ISO timestamp
  last_seen: string; // ISO timestamp
}

export interface Message {
  id: number;
  from_id: PeerId;
  to_id: PeerId;
  text: string;
  sent_at: string; // ISO timestamp
  delivered: boolean;
  // FIN flag: true means "I have nothing more to say" (handoff obligation ledger).
  // A normal message obligates the recipient to reply; a FIN message clears the
  // sender's own obligation and creates none on the recipient. Defaults to false.
  fin: boolean;
}

// --- Broker API types ---

export interface RegisterRequest {
  pid: number;
  cwd: string;
  git_root: string | null;
  tty: string | null;
  summary: string;
}

export interface RegisterResponse {
  id: PeerId;
}

export interface HeartbeatRequest {
  id: PeerId;
}

export interface SetSummaryRequest {
  id: PeerId;
  summary: string;
}

export interface ListPeersRequest {
  scope: "machine" | "directory" | "repo";
  // The requesting peer's context (used for filtering)
  cwd: string;
  git_root: string | null;
  exclude_id?: PeerId;
}

export interface SendMessageRequest {
  from_id: PeerId;
  to_id: PeerId;
  text: string;
  // Optional FIN flag (defaults to false). See Message.fin.
  fin?: boolean;
}

export interface PollMessagesRequest {
  id: PeerId;
}

export interface PollMessagesResponse {
  messages: Message[];
}

// --- Read-only message log (handoff obligation ledger source) ---
// Returns recent message metadata WITHOUT marking anything delivered.
// The watchdog derives owes/since/chatter from this raw log (broker stays dumb).

export interface MessagesLogRequest {
  // Only return messages with sent_at strictly greater than this ISO timestamp.
  since?: string;
  // Hard cap on rows returned (most recent first when capped). Defaults broker-side.
  limit?: number;
}

export interface MessageLogEntry {
  id: number;
  from_id: PeerId;
  to_id: PeerId;
  sent_at: string; // ISO timestamp
  fin: boolean;
}

export interface MessagesLogResponse {
  messages: MessageLogEntry[];
}

// --- Busy/idle state (fed by Claude Code hooks: PreToolUse=busy, Stop=idle) ---
// Ephemeral runtime signal, kept in-memory (NOT persisted): on broker restart
// hooks re-post on the next activity. Keyed by the peer's stable identity
// bracket (e.g. "[role:orchestrator project:projectB]"), set per-window via the
// CLAUDE_PEER_TAG env var so all peers in one repo (shared cwd) stay distinct.

export type PeerState = "busy" | "idle";

export interface SetStateRequest {
  key: string;
  state: PeerState;
}

export interface PeerStateEntry {
  key: string;
  state: PeerState;
  // Server-stamped time the peer ENTERED the current state (for idle-duration).
  since: string; // ISO timestamp
  // Server-stamped time of the most recent post for this key (liveness).
  updated_at: string; // ISO timestamp
}

export interface StatesResponse {
  states: PeerStateEntry[];
}
