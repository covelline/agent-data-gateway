export type WhyExtractionSource = "text" | "thinking" | "fallback" | "none";

export type FlagReason =
  | "no_preceding_text"
  | "why_too_short"
  | "upstream_error"
  | "upstream_timeout"
  | "client_disconnect"
  | "buffer_overflow"
  | "buffer_timeout"
  | "buffer_capacity"
  | null;

export interface AuditLogRow {
  id: number;
  timestamp: string;
  who: string;
  what: string;
  why: string | null;
  text_context: string | null;
  raw_response: Uint8Array | null;
  extraction_source: WhyExtractionSource;
  flag_reason: FlagReason;
  streaming: 0 | 1;
}

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: unknown };

export interface AnthropicMessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

export interface AnthropicMessageRequest {
  model: string;
  messages: Array<{ role: "user" | "assistant"; content: unknown }>;
  metadata?: { user_id?: string };
  stream?: boolean;
}

export * from "./db.ts";
